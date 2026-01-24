import { useCallback, useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import type { RadflowId, SourceLocation, SerializedComponentEntry } from "../stores/types";

/**
 * Configuration for selection behavior
 */
export interface UseInstanceSelectionOptions {
  /** Whether selection is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for handling click-to-select on elements with data-radflow-id attributes.
 *
 * Ported from Webstudio's instance-selection.ts with adaptations for RadFlow:
 * - Click handler finds element with data-radflow-id
 * - Updates selectedInstanceSelector store (bridgeSelection in RadFlow)
 * - Handles modifier keys:
 *   - Shift for multi-select
 *   - Alt/Option for selecting parent element
 *
 * @param iframeRef - Ref to the preview iframe
 * @param options - Configuration options
 */
export function useInstanceSelection(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: UseInstanceSelectionOptions = {}
) {
  const { enabled = true } = options;

  // Store state
  const editorMode = useAppStore((s) => s.editorMode);
  const bridgeComponentLookup = useAppStore((s) => s.bridgeComponentLookup);

  // Store actions
  const setBridgeSelection = useAppStore((s) => s.setBridgeSelection);
  const clearBridgeSelection = useAppStore((s) => s.clearBridgeSelection);
  const addToMultiSelect = useAppStore((s) => s.addToMultiSelect);
  const toggleMultiSelect = useAppStore((s) => s.toggleMultiSelect);
  const setMultiSelectEnabled = useAppStore((s) => s.setMultiSelectEnabled);

  /**
   * Find the nearest element with data-radflow-id from an event target.
   */
  const findRadflowElement = useCallback((target: EventTarget | null): Element | null => {
    if (!target || !(target instanceof Element)) {
      return null;
    }

    let element: Element | null = target;
    while (element) {
      if (element.hasAttribute("data-radflow-id")) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }, []);

  /**
   * Find parent element with data-radflow-id.
   */
  const findParentRadflowElement = useCallback((element: Element): Element | null => {
    let parent = element.parentElement;
    while (parent) {
      if (parent.hasAttribute("data-radflow-id")) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }, []);

  /**
   * Extract selection data from an element.
   */
  const extractSelectionData = useCallback(
    (element: Element): { radflowId: RadflowId; source: SourceLocation | null; fallbackSelectors: string[] } | null => {
      const radflowId = element.getAttribute("data-radflow-id");
      if (!radflowId) return null;

      // Try to get source from component lookup
      const componentEntry = bridgeComponentLookup.get(radflowId);
      const source = componentEntry?.source || null;
      const fallbackSelectors = componentEntry?.fallbackSelectors || [];

      return { radflowId, source, fallbackSelectors };
    },
    [bridgeComponentLookup]
  );

  /**
   * Handle click events from the iframe.
   */
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Skip if disabled or in preview mode
      if (!enabled || editorMode === "preview") {
        return;
      }

      const radflowElement = findRadflowElement(event.target);
      if (!radflowElement) {
        // Clicked outside any radflow element - clear selection
        clearBridgeSelection();
        return;
      }

      // Alt/Option key - select parent instead
      let targetElement = radflowElement;
      if (event.altKey) {
        const parentElement = findParentRadflowElement(radflowElement);
        if (parentElement) {
          targetElement = parentElement;
        }
      }

      const selectionData = extractSelectionData(targetElement);
      if (!selectionData) return;

      // Shift key - multi-select mode
      if (event.shiftKey) {
        setMultiSelectEnabled(true);
        toggleMultiSelect(selectionData.radflowId);
      } else {
        // Regular click - single select
        setMultiSelectEnabled(false);
        setBridgeSelection({
          radflowId: selectionData.radflowId,
          source: selectionData.source,
          fallbackSelectors: selectionData.fallbackSelectors,
        });
      }

      // Prevent default to avoid text selection, link navigation, etc.
      event.preventDefault();
      event.stopPropagation();
    },
    [
      enabled,
      editorMode,
      findRadflowElement,
      findParentRadflowElement,
      extractSelectionData,
      clearBridgeSelection,
      setBridgeSelection,
      setMultiSelectEnabled,
      toggleMultiSelect,
    ]
  );

  /**
   * Handle double-click to select deeply nested element.
   */
  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled || editorMode === "preview") {
        return;
      }

      // Double-click selects the exact element under cursor, even if deeply nested
      const target = event.target;
      if (!target || !(target instanceof Element)) return;

      // Find the deepest element with data-radflow-id at this position
      const radflowId = target.getAttribute("data-radflow-id");
      if (!radflowId) {
        // Target doesn't have radflow-id, but let handleClick deal with it
        return;
      }

      const selectionData = extractSelectionData(target);
      if (!selectionData) return;

      setBridgeSelection({
        radflowId: selectionData.radflowId,
        source: selectionData.source,
        fallbackSelectors: selectionData.fallbackSelectors,
      });

      event.preventDefault();
      event.stopPropagation();
    },
    [enabled, editorMode, extractSelectionData, setBridgeSelection]
  );

  // Set up event listeners on iframe content
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enabled) return;

    const setupListeners = () => {
      try {
        const contentDocument = iframe.contentDocument;
        if (!contentDocument) return;

        // Use capture phase to intercept before other handlers
        contentDocument.addEventListener("click", handleClick, { capture: true });
        contentDocument.addEventListener("dblclick", handleDoubleClick, { capture: true });

        return () => {
          contentDocument.removeEventListener("click", handleClick, { capture: true });
          contentDocument.removeEventListener("dblclick", handleDoubleClick, { capture: true });
        };
      } catch {
        // Cross-origin iframe - can't attach listeners directly
        // The bridge will handle selection events via postMessage instead
        console.debug("[useInstanceSelection] Cross-origin iframe, relying on bridge for selection events");
        return undefined;
      }
    };

    const handleLoad = () => {
      setupListeners();
    };

    iframe.addEventListener("load", handleLoad);

    // Also try to set up immediately if already loaded
    const cleanup = setupListeners();

    return () => {
      iframe.removeEventListener("load", handleLoad);
      cleanup?.();
    };
  }, [iframeRef, enabled, handleClick, handleDoubleClick]);

  // Clear selection when entering preview mode
  useEffect(() => {
    if (editorMode === "preview") {
      clearBridgeSelection();
    }
  }, [editorMode, clearBridgeSelection]);

  return {
    /** Select element by radflowId */
    selectById: useCallback(
      (radflowId: RadflowId) => {
        const componentEntry = bridgeComponentLookup.get(radflowId);
        setBridgeSelection({
          radflowId,
          source: componentEntry?.source || null,
          fallbackSelectors: componentEntry?.fallbackSelectors || [],
        });
      },
      [bridgeComponentLookup, setBridgeSelection]
    ),

    /** Clear current selection */
    clearSelection: clearBridgeSelection,

    /** Add to multi-selection */
    addToSelection: addToMultiSelect,
  };
}

export default useInstanceSelection;
