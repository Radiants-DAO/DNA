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
  type ModeState,
} from '@flow/shared';
import { useMutationBridge } from '../../panel/hooks/useMutationBridge';
import { useTextEditBridge } from '../../panel/hooks/useTextEditBridge';
import { useAppStore, type EditorMode } from '../../panel/stores/appStore';
import { EditorLayout } from '../../panel/components/layout/EditorLayout';
import { useSessionRestore } from '../../panel/hooks/useSessionRestore';
import { initContentBridge, disconnectContentBridge, onContentMessage } from '../../panel/api/contentBridge';

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
  revertMutation: (mutationId: string | 'all') => void;
  clearMutations: () => void;
  /** Apply style changes to the currently selected element */
  applyStyle: (styleChanges: Record<string, string>) => void;
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
  const [connected, setConnected] = useState(false);
  const [textEditActive, setTextEditActive] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Restore session from chrome.storage.session on panel open
  useSessionRestore(tabId);

  // Store actions for mutations
  const addMutationDiff = useAppStore((s) => s.addMutationDiff);
  const removeMutationDiff = useAppStore((s) => s.removeMutationDiff);
  const clearMutationDiffs = useAppStore((s) => s.clearMutationDiffs);

  // Store actions for bridge connection status
  const setBridgeConnected = useAppStore((s) => s.setBridgeConnected);
  const setBridgeDisconnected = useAppStore((s) => s.setBridgeDisconnected);

  // Mutation diff handlers - sync to store
  const handleMutationDiff = useCallback(
    (diff: MutationDiff) => {
      addMutationDiff(diff);
    },
    [addMutationDiff]
  );

  const handleMutationReverted = useCallback(
    (mutationId: string | 'all') => {
      if (mutationId === 'all') {
        clearMutationDiffs();
      } else {
        removeMutationDiff(mutationId);
      }
    },
    [clearMutationDiffs, removeMutationDiff]
  );

  // Get the elementRef from the selected element (sent by content script)
  const elementRef = selectedElement?.elementRef ?? null;

  // Mutation bridge hook
  const { applyStyle, revert, clear } = useMutationBridge({
    elementRef,
    tabId,
    onDiff: handleMutationDiff,
    onReverted: handleMutationReverted,
  });

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

    setConnected(true);
    setBridgeConnected('1.0.0'); // Mark as connected in store

    // Use onContentMessage so listener survives port reconnects
    const unsubscribe = onContentMessage((msg) => {
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

        if (anyMsg.type === 'flow:set-editor-mode') {
          const payload = anyMsg.payload as { mode: string; toolId: string };
          const store = useAppStore.getState();
          store.setEditorMode(payload.mode as EditorMode);
          return;
        }

        if (anyMsg.type === 'mode:changed') {
          const store = useAppStore.getState();
          store.setMode(anyMsg.payload as ModeState);
          return;
        }

        if (anyMsg.type === 'flow:add-prompt-step') {
          const store = useAppStore.getState();
          store.addPromptStep();
          return;
        }

        if (anyMsg.type === 'flow:copy-prompt') {
          const store = useAppStore.getState();
          store.copyToClipboard();
          return;
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
      syncPort.postMessage({
        type: 'flow:state-sync',
        state: {
          editorMode: state.editorMode,
          activeFeedbackType: state.activeFeedbackType ?? null,
          dogfoodMode: state.dogfoodMode,
          promptSteps: state.promptSteps ?? [],
          pendingSlot: state.pendingSlot ?? null,
          activeLanguage: state.activeLanguage ?? 'css',
        },
      });
    });

    port.onDisconnect.addListener(() => {
      setConnected(false);
      setBridgeDisconnected();
      portRef.current = null;
    });

    return () => {
      unsubscribe();
      unsubscribeStore();
      disconnectContentBridge();
    };
  }, [setBridgeConnected, setBridgeDisconnected]);

  // Revert and clear handlers for context
  const revertMutation = useCallback(
    (mutationId: string | 'all') => {
      revert(mutationId);
    },
    [revert]
  );

  const clearMutations = useCallback(() => {
    clear();
    clearMutationDiffs();
  }, [clear, clearMutationDiffs]);

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
      revertMutation,
      clearMutations,
      applyStyle,
    }),
    [
      hoveredElement,
      selectedElement,
      inspectionResult,
      agentGlobals,
      connected,
      textEditActive,
      revertMutation,
      clearMutations,
      applyStyle,
    ]
  );

  return (
    <InspectionContext.Provider value={contextValue}>
      <EditorLayout />
    </InspectionContext.Provider>
  );
}
