import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

/**
 * Canvas Rect Interface
 *
 * Represents the bounding rectangle and dimensions of the canvas iframe.
 * Used by overlay systems to position selection/hover indicators correctly.
 *
 * Ported from Flow 0 - Based on Webstudio's canvas-iframe.tsx pattern (AGPL-3.0).
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
 * useCanvasRect - Track element dimensions with ResizeObserver
 *
 * Features:
 * - ResizeObserver for efficient dimension tracking
 * - Updates on window resize
 * - Accounts for scroll position
 * - Provides scale factor for overlay calculations
 *
 * Ported from Flow 0 - Based on Webstudio's canvas rect tracking pattern (AGPL-3.0).
 *
 * @param elementRef - Reference to the element to track (e.g., canvas container)
 * @returns Object with current rect and methods to update/reset
 */
export function useCanvasRect(elementRef: React.RefObject<HTMLElement | null>) {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rectRef = useRef<CanvasRect>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    scale: 1,
  });

  /**
   * Calculate and update the canvas rect from the element's bounding box
   */
  const updateRect = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    rectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      scale: 1, // Scale can be updated if zoom is implemented
    };
  }, [elementRef]);

  /**
   * Force a rect update - useful after content changes
   */
  const forceUpdate = useCallback(() => {
    // Schedule on next frame to ensure DOM is settled
    requestAnimationFrame(updateRect);
  }, [updateRect]);

  /**
   * Get the current rect
   */
  const getRect = useCallback(() => rectRef.current, []);

  // Set up ResizeObserver to track element dimension changes
  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // Create ResizeObserver to watch for size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      updateRect();
    });

    resizeObserverRef.current.observe(element);

    // Initial measurement
    updateRect();

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [elementRef, updateRect]);

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

  return {
    /** Force an immediate rect update */
    forceUpdate,
    /** Update rect calculation */
    updateRect,
    /** Get current rect value */
    getRect,
  };
}

export default useCanvasRect;
