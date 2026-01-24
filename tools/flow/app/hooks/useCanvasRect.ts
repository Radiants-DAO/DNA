import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

/**
 * Canvas Rect Interface
 *
 * Represents the bounding rectangle and dimensions of the canvas iframe.
 * Used by overlay systems to position selection/hover indicators correctly.
 *
 * Based on Webstudio's canvas-iframe.tsx pattern (AGPL-3.0).
 */
export interface CanvasRect {
  /** Left position relative to viewport */
  left: number;
  /** Top position relative to viewport */
  top: number;
  /** Width of the canvas iframe */
  width: number;
  /** Height of the canvas iframe */
  height: number;
  /** Current scale factor (1 = 100%) */
  scale: number;
}

/**
 * useCanvasRect - Track iframe dimensions with ResizeObserver
 *
 * Features:
 * - ResizeObserver for efficient dimension tracking
 * - Updates on window resize
 * - Updates on iframe load
 * - Accounts for scroll position
 * - Provides scale factor for overlay calculations
 *
 * Based on Webstudio's canvas rect tracking pattern (AGPL-3.0).
 *
 * @param iframeRef - Reference to the canvas iframe element
 * @returns Object with current rect and methods to update/reset
 */
export function useCanvasRect(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Store state and actions
  const setCanvasRect = useAppStore((s) => s.setCanvasRect);
  const canvasScale = useAppStore((s) => s.canvasScale);

  /**
   * Calculate and update the canvas rect from the iframe's bounding box
   */
  const updateRect = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    const rect = iframe.getBoundingClientRect();

    setCanvasRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      scale: canvasScale,
    });
  }, [iframeRef, setCanvasRect, canvasScale]);

  /**
   * Force a rect update - useful after iframe loads or content changes
   */
  const forceUpdate = useCallback(() => {
    // Schedule on next frame to ensure DOM is settled
    requestAnimationFrame(updateRect);
  }, [updateRect]);

  // Set up ResizeObserver to track iframe dimension changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    // Create ResizeObserver to watch for size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      updateRect();
    });

    resizeObserverRef.current.observe(iframe);

    // Initial measurement
    updateRect();

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [iframeRef, updateRect]);

  // Update on window resize
  useEffect(() => {
    const handleResize = () => {
      updateRect();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateRect]);

  // Update on scroll (parent container scroll can affect rect)
  useEffect(() => {
    const handleScroll = () => {
      updateRect();
    };

    // Listen for scroll on window and capture phase for child scrolls
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [updateRect]);

  // Update when scale changes
  useEffect(() => {
    updateRect();
  }, [canvasScale, updateRect]);

  return {
    /** Force an immediate rect update */
    forceUpdate,
    /** Update rect calculation */
    updateRect,
  };
}

export default useCanvasRect;
