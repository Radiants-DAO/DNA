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
} from '@flow/shared';
import { useMutationBridge } from '../../panel/hooks/useMutationBridge';
import { useTextEditBridge } from '../../panel/hooks/useTextEditBridge';
import { useAppStore } from '../../panel/stores/appStore';
import { EditorLayout } from '../../panel/components/layout/EditorLayout';
import { initContentBridge, disconnectContentBridge } from '../../panel/api/contentBridge';

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
  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;

    // Initialize the content bridge singleton which creates the SINGLE port.
    // contentBridge already sends panel:init, so we don't need to do it here.
    const port = initContentBridge(tabId);
    portRef.current = port;

    setConnected(true);
    setBridgeConnected('1.0.0'); // Mark as connected in store

    port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
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
          // Synthesize selectedElement if not already set (e.g., from panel:inspect via SearchPanel)
          // This ensures RightPanel shows the designer sections even when inspection
          // was triggered programmatically rather than by Alt+click
          setSelectedElement((prev) => {
            if (prev) return prev; // Already have a selection, don't overwrite
            if (!msg.result) return null;
            return {
              elementRef: 'selected',
              elementIndex: -1, // Not tracked when inspecting via selector
              selector: msg.result.selector,
              tagName: msg.result.tagName,
              id: '', // Not available from InspectionResult
              classList: [],
              rect: { top: 0, left: 0, width: 0, height: 0 },
              textPreview: '',
            };
          });
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      setConnected(false);
      setBridgeDisconnected();
      portRef.current = null;
    });

    return () => {
      // disconnectContentBridge will disconnect the port
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
