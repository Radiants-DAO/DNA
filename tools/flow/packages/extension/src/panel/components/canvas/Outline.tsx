import { useState, useEffect, useCallback, useRef } from "react";
import type { RadflowId, SerializedComponentEntry } from "../../stores/types";

/**
 * Outline variant for different states
 */
export type OutlineVariant = "selected" | "hovered" | "multi-selected";

/**
 * Position and size of an outline
 */
export interface OutlineRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Props for individual outline component
 */
export interface OutlineProps {
  /** Bounding rect of the element */
  rect: OutlineRect;
  /** Label to display (component name or tag) */
  label: string;
  /** Outline variant (selected, hovered, multi-selected) */
  variant: OutlineVariant;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Scale factor for the canvas (for handling zoomed previews) */
  scale?: number;
}

/**
 * Variant-specific styles
 * sky-blue for selection, sunset-fuzz for hover, green for multi-select
 */
const VARIANT_STYLES: Record<OutlineVariant, { border: string; bg: string; labelBg: string }> = {
  selected: {
    border: "border-[#95BAD2]",
    bg: "bg-[#95BAD2]/10",
    labelBg: "bg-[#95BAD2]",
  },
  hovered: {
    border: "border-[#FCC383]",
    bg: "bg-transparent",
    labelBg: "bg-[#FCC383]",
  },
  "multi-selected": {
    border: "border-[#CEF5CA]",
    bg: "bg-[#CEF5CA]/10",
    labelBg: "bg-[#CEF5CA]",
  },
};

/**
 * Outline - Renders a colored border around an element.
 *
 * Ported from Flow 0's outline components:
 * - Positioned using element's bounding rect
 * - Handles iframe scaling (overlays at 100%, canvas scaled)
 * - Shows label with element name/type
 */
export function Outline({
  rect,
  label,
  variant,
  showLabel = true,
  scale = 1,
}: OutlineProps) {
  const styles = VARIANT_STYLES[variant];

  // Apply scale inverse to keep outline at consistent visual size
  const borderWidth = 2 / scale;
  const labelFontSize = 11 / scale;
  const labelPadding = `${2 / scale}px ${6 / scale}px`;

  return (
    <div
      className={`absolute pointer-events-none ${styles.border} ${styles.bg}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        boxSizing: "border-box",
      }}
      data-flow-canvas-tool="outline"
    >
      {/* Label */}
      {showLabel && label && (
        <div
          className={`absolute ${styles.labelBg} text-white font-medium whitespace-nowrap rounded-sm`}
          style={{
            top: rect.top > 20 ? -20 / scale : rect.height,
            left: 0,
            fontSize: `${labelFontSize}px`,
            padding: labelPadding,
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/**
 * Props for the SelectionOutline component
 */
export interface SelectionOutlineProps {
  /** The selected component entry */
  entry: SerializedComponentEntry | null;
  /** Container element to calculate position relative to */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Iframe element to get element rects from */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Scale factor for the canvas */
  scale?: number;
}

/**
 * Hook to track element rect with ResizeObserver
 */
function useElementRect(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  selector: string | null,
  containerRef: React.RefObject<HTMLElement | null>
): OutlineRect | null {
  const [rect, setRect] = useState<OutlineRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateRect = useCallback(() => {
    if (!selector || !iframeRef.current || !containerRef.current) {
      setRect(null);
      return;
    }

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) {
        setRect(null);
        return;
      }

      // Find element by selector or flow-id
      let element: Element | null = null;
      if (selector.startsWith("[data-flow-id=")) {
        element = iframeDoc.querySelector(selector);
      } else {
        // Try to find by flow-id attribute value
        element = iframeDoc.querySelector(`[data-flow-id="${selector}"]`);
      }

      if (!element) {
        setRect(null);
        return;
      }

      // Get element rect relative to iframe viewport
      const elementRect = element.getBoundingClientRect();

      // Get iframe position relative to container
      const iframeRect = iframeRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate position relative to container
      const offsetTop = iframeRect.top - containerRect.top;
      const offsetLeft = iframeRect.left - containerRect.left;

      setRect({
        top: elementRect.top + offsetTop,
        left: elementRect.left + offsetLeft,
        width: elementRect.width,
        height: elementRect.height,
      });
    } catch {
      // Cross-origin or other error
      setRect(null);
    }
  }, [selector, iframeRef, containerRef]);

  // Update on selector change and set up observers
  useEffect(() => {
    updateRect();

    if (!selector || !iframeRef.current) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeDoc || !iframeWindow) return;

      // Find the element to observe
      const element = iframeDoc.querySelector(`[data-flow-id="${selector}"]`);
      if (!element) return;

      // Set up ResizeObserver for size changes
      observerRef.current = new ResizeObserver(() => {
        // Use requestAnimationFrame to batch updates
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updateRect);
      });

      observerRef.current.observe(element);

      // Also listen for scroll and resize
      const handleUpdate = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updateRect);
      };

      iframeWindow.addEventListener("scroll", handleUpdate, { passive: true });
      iframeWindow.addEventListener("resize", handleUpdate, { passive: true });
      window.addEventListener("resize", handleUpdate, { passive: true });

      return () => {
        observerRef.current?.disconnect();
        iframeWindow.removeEventListener("scroll", handleUpdate);
        iframeWindow.removeEventListener("resize", handleUpdate);
        window.removeEventListener("resize", handleUpdate);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } catch {
      // Cross-origin iframe
      return undefined;
    }
  }, [selector, iframeRef, containerRef, updateRect]);

  return rect;
}

/**
 * SelectionOutline - Renders outline for the currently selected element.
 */
export function SelectionOutline({
  entry,
  containerRef,
  iframeRef,
  scale = 1,
}: SelectionOutlineProps) {
  const selector = entry?.radflowId || null;
  const rect = useElementRect(iframeRef, selector, containerRef);

  if (!rect || !entry) return null;

  const label = entry.displayName || entry.name || entry.fiberType || "Element";

  return <Outline rect={rect} label={label} variant="selected" scale={scale} />;
}

/**
 * Props for the HoverOutline component
 */
export interface HoverOutlineProps {
  /** The hovered element ID */
  hoveredId: RadflowId | null;
  /** Component lookup map */
  componentLookup: Map<RadflowId, SerializedComponentEntry>;
  /** Container element to calculate position relative to */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Iframe element to get element rects from */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Scale factor for the canvas */
  scale?: number;
}

/**
 * HoverOutline - Renders outline for the currently hovered element.
 */
export function HoverOutline({
  hoveredId,
  componentLookup,
  containerRef,
  iframeRef,
  scale = 1,
}: HoverOutlineProps) {
  const rect = useElementRect(iframeRef, hoveredId, containerRef);
  const entry = hoveredId ? componentLookup.get(hoveredId) : null;

  if (!rect || !hoveredId) return null;

  const label = entry?.displayName || entry?.name || entry?.fiberType || "Element";

  return <Outline rect={rect} label={label} variant="hovered" scale={scale} showLabel={false} />;
}

export default Outline;
