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
  FLOW_PANEL_PORT_NAME,
  type BackgroundToPanelMessage,
  type PanelToBackgroundMessage,
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
  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;

    // Initialize the content bridge singleton FIRST so child components
    // can use sendToContent immediately without messages being dropped
    initContentBridge(tabId);

    const port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });
    portRef.current = port;

    // Register this panel with the service worker
    const initMsg: PanelToBackgroundMessage = {
      type: 'panel:init',
      payload: { tabId },
    };
    port.postMessage(initMsg);
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
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      setConnected(false);
      setBridgeDisconnected();
      portRef.current = null;
    });

    return () => {
      port.disconnect();
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
