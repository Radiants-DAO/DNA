/**
 * Clamps a popover's position so it stays within its container bounds.
 * Handles horizontal clamping and vertical flip (render above anchor when near bottom).
 *
 * @param anchorX     - Click x position relative to container (px)
 * @param anchorY     - Click y position relative to container (px)
 * @param popoverW    - Popover width (px), default 256 (w-64)
 * @param popoverH    - Estimated popover height (px), default 180
 * @param containerW  - Container width (px)
 * @param containerH  - Container height (px)
 * @param gap         - Gap between anchor and popover (px), default 8
 */
export function clampPopoverPosition(
  anchorX: number,
  anchorY: number,
  popoverW: number = 256,
  popoverH: number = 180,
  containerW: number,
  containerH: number,
  gap: number = 8
): { left: number; top?: number; bottom?: number } {
  const halfW = popoverW / 2;
  const margin = 8;

  // Clamp horizontal so popover stays within container
  const left = Math.max(halfW + margin, Math.min(containerW - halfW - margin, anchorX));

  // Flip vertical: render above anchor if too close to bottom
  const flipThreshold = containerH - popoverH - gap - margin;
  if (anchorY > flipThreshold) {
    return { left, bottom: containerH - anchorY + gap };
  }

  return { left, top: anchorY + gap };
}
