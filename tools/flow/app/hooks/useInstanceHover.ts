import { useCallback, useRef, useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import type { RadflowId } from "../stores/types";

/**
 * Configuration for hover detection
 */
export interface UseInstanceHoverOptions {
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number;
  /** Whether hover detection is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for detecting hover over elements with data-radflow-id attributes.
 *
 * Ported from Webstudio's instance-hovering.ts with adaptations for RadFlow:
 * - Listens for mouseover events on iframe content
 * - Debounces hover state (100ms default) to prevent flashing
 * - Updates $hoveredInstanceSelector store (bridgeHoveredId in RadFlow)
 * - Skips updates while scrolling
 *
 * @param iframeRef - Ref to the preview iframe
 * @param options - Configuration options
 */
export function useInstanceHover(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: UseInstanceHoverOptions = {}
) {
  const { debounceMs = 100, enabled = true } = options;

  // Refs for debouncing and scroll detection
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoveredIdRef = useRef<RadflowId | null>(null);

  // Store actions
  const setBridgeHoveredId = useAppStore((s) => s.setBridgeHoveredId);
  const editorMode = useAppStore((s) => s.editorMode);

  /**
   * Find the nearest element with data-radflow-id from an event target.
   */
  const findRadflowElement = useCallback((target: EventTarget | null): Element | null => {
    if (!target || !(target instanceof Element)) {
      return null;
    }

    // Walk up the DOM tree to find element with data-radflow-id
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
   * Handle mouseover events from the iframe.
   */
  const handleMouseOver = useCallback(
    (event: MouseEvent) => {
      // Skip if disabled or in preview mode
      if (!enabled || editorMode === "preview") {
        return;
      }

      // Skip if currently scrolling
      if (isScrollingRef.current) {
        return;
      }

      const radflowElement = findRadflowElement(event.target);
      const radflowId = radflowElement?.getAttribute("data-radflow-id") || null;

      // Skip if same element
      if (radflowId === lastHoveredIdRef.current) {
        return;
      }

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the hover state update
      debounceTimeoutRef.current = setTimeout(() => {
        lastHoveredIdRef.current = radflowId;
        setBridgeHoveredId(radflowId);
      }, debounceMs);
    },
    [enabled, editorMode, debounceMs, findRadflowElement, setBridgeHoveredId]
  );

  /**
   * Handle mouseout events from the iframe.
   */
  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      // Check if we're leaving the iframe entirely
      const relatedTarget = event.relatedTarget;
      if (!relatedTarget || !(relatedTarget instanceof Element)) {
        // Clear debounce timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Clear hover state
        lastHoveredIdRef.current = null;
        setBridgeHoveredId(null);
      }
    },
    [setBridgeHoveredId]
  );

  /**
   * Handle scroll events to suppress hover updates during scrolling.
   */
  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;

    // Clear existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Resume hover detection after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  // Set up event listeners on iframe content
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enabled) return;

    // We need to listen to the iframe's content document
    const setupListeners = () => {
      try {
        const contentDocument = iframe.contentDocument;
        const contentWindow = iframe.contentWindow;
        if (!contentDocument || !contentWindow) return;

        contentDocument.addEventListener("mouseover", handleMouseOver);
        contentDocument.addEventListener("mouseout", handleMouseOut);
        contentWindow.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
          contentDocument.removeEventListener("mouseover", handleMouseOver);
          contentDocument.removeEventListener("mouseout", handleMouseOut);
          contentWindow.removeEventListener("scroll", handleScroll);
        };
      } catch {
        // Cross-origin iframe - can't attach listeners directly
        // The bridge will handle hover events via postMessage instead
        console.debug("[useInstanceHover] Cross-origin iframe, relying on bridge for hover events");
        return undefined;
      }
    };

    // Set up listeners after iframe loads
    const handleLoad = () => {
      setupListeners();
    };

    iframe.addEventListener("load", handleLoad);

    // Also try to set up immediately if already loaded
    const cleanup = setupListeners();

    return () => {
      iframe.removeEventListener("load", handleLoad);
      cleanup?.();

      // Clear all timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [iframeRef, enabled, handleMouseOver, handleMouseOut, handleScroll]);

  // Clear hover on mode changes
  useEffect(() => {
    if (editorMode === "preview") {
      lastHoveredIdRef.current = null;
      setBridgeHoveredId(null);
    }
  }, [editorMode, setBridgeHoveredId]);

  return {
    /** Manually clear hover state */
    clearHover: useCallback(() => {
      lastHoveredIdRef.current = null;
      setBridgeHoveredId(null);
    }, [setBridgeHoveredId]),

    /** Current hovered element ID */
    hoveredId: lastHoveredIdRef.current,
  };
}

export default useInstanceHover;
