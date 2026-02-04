/**
 * Convert a bounding rect to CSS custom properties for overlay positioning.
 * Uses CSS vars to avoid layout thrash when updating positions.
 */
export function toOverlayVars(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  return {
    '--top': `${Math.round(rect.top + window.scrollY)}px`,
    '--left': `${Math.round(rect.left)}px`,
    '--width': `${Math.round(rect.width)}px`,
    '--height': `${Math.round(rect.height)}px`,
  } as const;
}
