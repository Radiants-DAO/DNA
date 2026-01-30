import type { MarqueeRect } from "../../hooks/useMarqueeSelection";

interface MarqueeSelectionProps {
  /** The current marquee rectangle (screen coordinates) */
  rect: MarqueeRect | null;
  /** Container ref for relative positioning */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Renders the visual marquee selection rectangle overlay.
 *
 * The rectangle is rendered in screen coordinates as a fixed overlay
 * on top of the canvas. It shows a semi-transparent blue fill with
 * a dashed border to indicate the selection area.
 */
export function MarqueeSelection({
  rect,
  containerRef,
}: MarqueeSelectionProps): React.ReactElement | null {
  if (!rect) return null;

  const container = containerRef.current;
  if (!container) return null;

  const containerRect = container.getBoundingClientRect();

  // Calculate position relative to container
  const left = Math.min(rect.startX, rect.endX) - containerRect.left;
  const top = Math.min(rect.startY, rect.endY) - containerRect.top;
  const width = Math.abs(rect.endX - rect.startX);
  const height = Math.abs(rect.endY - rect.startY);

  // Don't render if too small (prevents flash on click)
  if (width < 3 && height < 3) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        border: "1px dashed rgba(59, 130, 246, 0.6)",
        borderRadius: 2,
      }}
      aria-hidden="true"
    />
  );
}

export default MarqueeSelection;
