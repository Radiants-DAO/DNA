/**
 * Panel - DevTools panel entrypoint
 *
 * Handles Chrome DevTools connection and message routing,
 * syncs state to Zustand store, and renders EditorLayout.
 *
 * Connection logic is kept here, while UI is delegated to EditorLayout.
 * Inspection data is provided via context for components that need it.
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import {
  type BackgroundToPanelMessage,
  type ElementHoveredMessage,
  type ElementSelectedMessage,
  type InspectionResult,
  type MutationDiff,
  type MutationStateEvent,
  type ModeState,
} from '@flow/shared';
import { useMutationBridge } from '../../panel/hooks/useMutationBridge';
import { useTextEditBridge } from '../../panel/hooks/useTextEditBridge';
import { usePromptAutoCompile } from '../../panel/hooks/usePromptAutoCompile';
import { useSessionSync } from '../../panel/hooks/useSessionSync';
import { useAppStore, type EditorMode } from '../../panel/stores/appStore';
import type { FeedbackType } from '../../panel/stores/types';
import { EditorLayout } from '../../panel/components/layout/EditorLayout';
import { useSessionAutoSave } from '../../panel/hooks/useSessionAutoSave';
import { useSessionRestore } from '../../panel/hooks/useSessionRestore';
import { initContentBridge, disconnectContentBridge, onContentMessage } from '../../panel/api/contentBridge';
import {
  isRuntimeMessagingError,
  safePortPostMessage,
} from '../../utils/runtimeSafety';
import type { PromptChip } from '@flow/shared';

// Type guard for BackgroundToPanelMessage
function isBackgroundToPanelMessage(msg: unknown): msg is BackgroundToPanelMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg;
}

// ─── Inspection Context ───

interface InspectionContextValue {
  hoveredElement: ElementHoveredMessage['payload'] | null;
  selectedElement: ElementSelectedMessage['payload'] | null;
  inspectionResult: InspectionResult | null;
  agentGlobals: string[];
  connected: boolean;
  textEditActive: boolean;
  setTextEditActive: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearMutations: () => void;
  /** Apply style changes to the currently selected element */
  applyStyle: (styleChanges: Record<string, string>) => void;
  /** All persistently selected element selectors (multi-selection state). */
  activeSelectors: string[];
}

const InspectionContext = createContext<InspectionContextValue | null>(null);

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) {
    throw new Error('useInspection must be used within Panel');
  }
  return ctx;
}

// ─── Panel Component ───

export function Panel() {
  // Local state for inspection data (not persisted)
  const [hoveredElement, setHoveredElement] =
    useState<ElementHoveredMessage['payload'] | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<ElementSelectedMessage['payload'] | null>(null);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [agentGlobals, setAgentGlobals] = useState<string[]>([]);
  const [activeSelectors, setActiveSelectors] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const bridgeConnectedRef = useRef(false);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Restore session from chrome.storage.session on panel open
  useSessionRestore(tabId);

  // Persist session changes to chrome.storage.session
  useSessionAutoSave(tabId);

  // Auto-recompile prompt when source data changes (300ms debounce)
  usePromptAutoCompile();

  // Auto-push compiled prompt to sidecar MCP server
  useSessionSync();

  // Store actions for mutations
  const addMutationDiff = useAppStore((s) => s.addMutationDiff);
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const addComment = useAppStore((s) => s.addComment);
  const updateComment = useAppStore((s) => s.updateComment);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  // Store actions for bridge connection status
  const setBridgeConnected = useAppStore((s) => s.setBridgeConnected);
  const setBridgeDisconnected = useAppStore((s) => s.setBridgeDisconnected);

  // Text edit mode state is owned by editorMode in Zustand.
  const textEditActive = editorMode === 'text-edit';
  const setTextEditActive = useCallback((active: boolean) => {
    setEditorMode(active ? 'text-edit' : 'cursor');
  }, [setEditorMode]);

  // Get the selector from the selected element (sent by content script)
  const selector = selectedElement?.selector ?? null;

  // Mutation bridge hook — sends selector-based commands, receives mutation:state
  const { applyStyle, undo, redo, clearAll } = useMutationBridge({
    selector,
    tabId,
  });

  // Cmd+Z / Cmd+Shift+Z keyboard shortcuts → unified engine undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Legacy diff handler for text edit bridge (still uses onDiff callback)
  const handleMutationDiff = useCallback(
    (diff: MutationDiff) => {
      addMutationDiff(diff);
    },
    [addMutationDiff]
  );

  // Text edit bridge hook
  useTextEditBridge({
    active: textEditActive,
    tabId,
    onDiff: handleMutationDiff,
  });

  // Chrome extension port connection
  // IMPORTANT: We use the SINGLE port from contentBridge to avoid dual-port issues.
  // Previously, both contentBridge and Panel.tsx created their own ports, but
  // background only stores one port per tab, so whichever connected last won.
  //
  // We use onContentMessage() instead of direct port.onMessage.addListener() so that
  // our listener is tracked and automatically reattached when the port reconnects
  // after service worker restarts.
  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;

    // Initialize the content bridge singleton which creates the SINGLE port.
    // contentBridge already sends panel:init, so we don't need to do it here.
    const port = initContentBridge(tabId);
    portRef.current = port;

    if (port) {
      setConnected(true);
      setBridgeConnected('1.0.0'); // Mark as connected in store
      bridgeConnectedRef.current = true;
    } else {
      setConnected(false);
      setBridgeDisconnected();
      bridgeConnectedRef.current = false;
    }

    // Use onContentMessage so listener survives port reconnects
    const unsubscribe = onContentMessage((msg) => {
      // First message after reconnect marks bridge healthy again.
      if (!bridgeConnectedRef.current) {
        setConnected(true);
        setBridgeConnected('1.0.0');
        bridgeConnectedRef.current = true;
      }

      // Handle annotation element selection from content script (untyped message)
      if (typeof msg === 'object' && msg !== null && (msg as Record<string, unknown>).type === 'annotation-element-selected') {
        const anyMsg = msg as Record<string, unknown>;
        if (anyMsg.payload) {
          const { selector } = anyMsg.payload as { selector: string; tagName: string };
          const store = useAppStore.getState();
          if (store.pendingSlot) {
            store.fillSlot({ selector });
          }
        }
        return;
      }

      // Handle on-page UI actions (toolbar, spotlight)
      if (typeof msg === 'object' && msg !== null) {
        const anyMsg = msg as Record<string, unknown>;

        // Fallback mutation state path: content broadcasts mutation:state on the
        // main content port too, so keep panel state in sync even if the
        // dedicated mutation port reconnects.
        if (anyMsg.kind === 'mutation:state') {
          const evt = anyMsg as unknown as MutationStateEvent;
          const store = useAppStore.getState();
          store.setMutationState({
            netDiffs: evt.netDiffs,
            canUndo: evt.canUndo,
            canRedo: evt.canRedo,
            undoCount: evt.undoCount,
            redoCount: evt.redoCount,
          });
          return;
        }

        if (anyMsg.type === 'flow:set-editor-mode') {
          const payload = anyMsg.payload as { mode: string; toolId: string };
          const store = useAppStore.getState();
          store.setEditorMode(payload.mode as EditorMode);
          return;
        }

        if (anyMsg.type === 'mode:changed') {
          const nextMode = anyMsg.payload as ModeState;
          const store = useAppStore.getState();
          store.setMode(nextMode);

          // Keep panel comment/question UX in sync with content mode changes.
          if (nextMode.topLevel === 'comment' || nextMode.topLevel === 'question') {
            store.setEditorMode('comment');
            store.setActiveFeedbackType(nextMode.topLevel);
          } else {
            const current = useAppStore.getState();
            if (current.activeFeedbackType !== null) {
              current.setActiveFeedbackType(null);
            }
            const refreshed = useAppStore.getState();
            if (refreshed.editorMode === 'comment') {
              refreshed.setEditorMode('cursor');
            }
          }

          // Keep text-edit bridge activation aligned to content mode.
          if (nextMode.topLevel === 'editText') {
            useAppStore.getState().setEditorMode('text-edit');
          } else {
            const current = useAppStore.getState();
            if (current.editorMode === 'text-edit') {
              current.setEditorMode('cursor');
            }
          }
          return;
        }

        if (anyMsg.type === 'flow:add-prompt-step') {
          const store = useAppStore.getState();
          store.addPromptStep();
          return;
        }

        if (anyMsg.type === 'flow:focus-typography') {
          setActivePanel('typography');
          return;
        }

        if (anyMsg.type === 'comment:submitted') {
          const payload = anyMsg.payload as {
            id: string;
            type: FeedbackType;
            selector: string;
            componentName: string;
            content: string;
            coordinates: { x: number; y: number };
            linkedSelectors?: string[];
          };
          const existing = useAppStore.getState().comments.some((c) => c.id === payload.id);
          if (!existing) {
            addComment({
              id: payload.id,
              type: payload.type,
              elementSelector: payload.selector,
              componentName: payload.componentName,
              devflowId: null,
              source: null,
              content: payload.content,
              coordinates: payload.coordinates,
              linkedSelectors: payload.linkedSelectors,
            });
          }
          return;
        }

        if (anyMsg.type === 'comment:edited') {
          const payload = anyMsg.payload as { id: string; content: string };
          if (payload.id && typeof payload.content === 'string') {
            updateComment(payload.id, payload.content);
          }
          return;
        }

        // Handle agent messages routed through background (bg: prefix)
        if (anyMsg.type === 'bg:agent-feedback') {
          useAppStore.getState().addAgentFeedback(anyMsg.payload as import('@flow/shared').AgentFeedback);
          return;
        }
        if (anyMsg.type === 'bg:agent-resolve') {
          const payload = anyMsg.payload as { tabId: number; targetId: string; summary: string };
          useAppStore.getState().resolveByAgent(payload.tabId, payload.targetId, payload.summary);
          return;
        }
        if (anyMsg.type === 'bg:agent-thread-reply') {
          const payload = anyMsg.payload as { tabId: number; targetId: string; message: import('@flow/shared').ThreadMessage };
          useAppStore.getState().addThreadReply(payload.tabId, payload.targetId, payload.message);
          return;
        }

        if (anyMsg.type === 'flow:copy-prompt') {
          const store = useAppStore.getState();
          store.copyToClipboard();
          return;
        }

        if (anyMsg.type === 'flow:prompt-action') {
          const store = useAppStore.getState();
          const payload = (anyMsg.payload ?? {}) as {
            action?: string;
            text?: string;
            nodeId?: string;
            chip?: Omit<PromptChip, 'id'> & { id?: string };
            index?: number;
          };
          switch (payload.action) {
            case 'insert-text':
              if (typeof payload.text === 'string' && payload.text.trim().length > 0) {
                store.insertPromptDraftText(payload.text, payload.index);
              }
              return;
            case 'insert-chip':
              if (payload.chip && typeof payload.chip.label === 'string') {
                store.insertPromptDraftChip(payload.chip, payload.index);
              }
              return;
            case 'remove-node':
              if (typeof payload.nodeId === 'string' && payload.nodeId.length > 0) {
                store.removePromptDraftNode(payload.nodeId);
              }
              return;
            case 'clear-draft':
              store.clearPromptDraft();
              return;
            default:
              return;
          }
        }

        if (anyMsg.type === 'flow:action') {
          // Generic action dispatch — extend as needed
          return;
        }
      }

      // Type guard ensures we only handle BackgroundToPanelMessage
      if (!isBackgroundToPanelMessage(msg)) return;

      switch (msg.type) {
        case 'element:hovered':
          setHoveredElement(msg.payload);
          break;
        case 'element:unhovered':
          setHoveredElement(null);
          break;
        case 'selection:multi-state':
          setActiveSelectors(msg.payload.selectors);
          break;
        case 'element:selected':
          setSelectedElement(msg.payload);
          // Clear previous inspection result while new one loads
          setInspectionResult(null);
          break;
        case 'agent:ready':
          setAgentGlobals(msg.payload.globals);
          break;
        case 'flow:content:inspection-result':
          setInspectionResult(msg.result);
          // Only set selectedElement if:
          // 1. No selection exists, OR
          // 2. This is a different element (from panel:inspect via Search)
          // Preserve existing selection metadata for Alt+click flow where
          // element:selected arrives first with full metadata, then inspection-result
          // arrives for the same element - we don't want to overwrite the richer data.
          if (msg.result) {
            setSelectedElement((prev) => {
              // If same element, keep the richer metadata from element:selected
              if (prev && prev.selector === msg.result.selector) {
                // Just update elementRef if provided
                return msg.elementRef ? { ...prev, elementRef: msg.elementRef } : prev;
              }
              // New element (from Search inspect) - create minimal selection
              return {
                elementRef: msg.elementRef || 'selected',
                elementIndex: -1, // Not tracked when inspecting via selector
                selector: msg.result.selector,
                tagName: msg.result.tagName,
                id: '', // Not available from InspectionResult
                classList: [],
                rect: { top: 0, left: 0, width: 0, height: 0 },
                textPreview: '',
              };
            });
          }
          break;
      }
    });

    // State sync: broadcast Zustand state snapshots to on-page UI
    const unsubscribeStore = useAppStore.subscribe((state) => {
      const syncPort = portRef.current;
      if (!syncPort) return;
      const componentSources = (state.components ?? []).slice(0, 200).map((component) => ({
        name: component.name,
        file: component.file,
        line: component.line,
        column: component.column,
      }));
      const activeTokens = state.getActiveTokens?.();
      const tokenSources = [
        ...Object.entries(activeTokens?.inline ?? {}).map(([name, value]) => ({
          name,
          value,
          tier: 'inline' as const,
        })),
        ...Object.entries(activeTokens?.public ?? {}).map(([name, value]) => ({
          name,
          value,
          tier: 'public' as const,
        })),
      ].slice(0, 400);
      const assetSources = [
        ...state.getMergedIcons().map((asset) => ({
          id: asset.id,
          name: asset.name,
          path: asset.path,
          type: 'icon' as const,
        })),
        ...state.getMergedLogos().map((asset) => ({
          id: asset.id,
          name: asset.name,
          path: asset.path,
          type: 'logo' as const,
        })),
        ...state.getMergedImages().map((asset) => ({
          id: asset.id,
          name: asset.name,
          path: asset.path,
          type: 'image' as const,
        })),
      ].slice(0, 300);
      safePortPostMessage(syncPort, {
        type: 'flow:state-sync',
        state: {
          editorMode: state.editorMode,
          activeFeedbackType: state.activeFeedbackType ?? null,
          dogfoodMode: state.dogfoodMode,
          promptSteps: state.promptSteps ?? [],
          promptDraft: state.promptDraft ?? [],
          promptSources: {
            components: componentSources,
            tokens: tokenSources,
            assets: assetSources,
          },
          pendingSlot: state.pendingSlot ?? null,
          activeLanguage: state.activeLanguage ?? 'css',
        },
      }, (error) => {
        if (isRuntimeMessagingError(error)) {
          setConnected(false);
          setBridgeDisconnected();
          portRef.current = null;
          bridgeConnectedRef.current = false;
          return;
        }
        console.error('[Panel] Failed to sync state to content script:', error);
      });

      // Push session data to background for prompt compilation
      safePortPostMessage(syncPort, {
        type: 'panel:session-data',
        payload: {
          annotations: state.annotations ?? [],
          textEdits: state.textEdits ?? [],
          mutationDiffs: state.mutationDiffs ?? [],
          animationDiffs: state.animationDiffs ?? [],
          promptDraft: state.promptDraft ?? [],
          promptSteps: state.promptSteps ?? [],
          comments: state.comments ?? [],
        },
      });
    });

    if (port) {
      port.onDisconnect.addListener(() => {
        setConnected(false);
        setBridgeDisconnected();
        portRef.current = null;
        bridgeConnectedRef.current = false;
      });
    }

    return () => {
      unsubscribe();
      unsubscribeStore();
      disconnectContentBridge();
    };
  }, [
    setBridgeConnected,
    setBridgeDisconnected,
    setActivePanel,
    addComment,
    updateComment,
  ]);

  // Clear handler for context
  const clearMutations = useCallback(() => {
    clearAll();
  }, [clearAll]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<InspectionContextValue>(
    () => ({
      hoveredElement,
      selectedElement,
      inspectionResult,
      agentGlobals,
      connected,
      textEditActive,
      setTextEditActive,
      undo,
      redo,
      clearMutations,
      applyStyle,
      activeSelectors,
    }),
    [
      hoveredElement,
      selectedElement,
      inspectionResult,
      agentGlobals,
      connected,
      textEditActive,
      undo,
      redo,
      clearMutations,
      applyStyle,
      activeSelectors,
    ]
  );

  return (
    <InspectionContext.Provider value={contextValue}>
      <EditorLayout />
    </InspectionContext.Provider>
  );
}
