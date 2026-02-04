/**
 * Convert a bounding rect to CSS custom properties for overlay positioning.
 * Uses CSS vars to avoid layout thrash when updating positions.
 *
 * Note: Since overlay root uses position:fixed, getBoundingClientRect() viewport
 * coordinates are used directly without scroll offsets.
 */
export function toOverlayVars(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  return {
    '--top': `${Math.round(rect.top)}px`,
    '--left': `${Math.round(rect.left)}px`,
    '--width': `${Math.round(rect.width)}px`,
    '--height': `${Math.round(rect.height)}px`,
  } as const;
}
