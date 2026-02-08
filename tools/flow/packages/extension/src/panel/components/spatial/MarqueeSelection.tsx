/**
 * MarqueeSelection - Visual marquee selection overlay
 *
 * Ported from Flow 0.
 */

import { memo } from "react";
import type { MarqueeRect } from "../../hooks/useMarqueeSelection";

interface MarqueeSelectionProps {
  /** The current marquee rectangle (screen coordinates) */
  rect: MarqueeRect | null;
  /** Container rect for relative positioning (pre-computed to avoid layout thrashing) */
  containerRect: DOMRect | null;
}

/**
 * Renders the visual marquee selection rectangle overlay.
 */
export const MarqueeSelection = memo(function MarqueeSelection({
  rect,
  containerRect,
}: MarqueeSelectionProps): React.ReactElement | null {
  if (!rect) return null;
  if (!containerRect) return null;

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
});

export default MarqueeSelection;
