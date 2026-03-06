import type { DitherGradientType } from './types'

/**
 * Linear gradient: project pixel onto gradient line.
 * CSS convention: 0deg = bottom-to-top, 90deg = left-to-right.
 */
export function linearGradientValue(
  x: number, y: number,
  width: number, height: number,
  angleDeg: number
): number {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)

  const halfLength = Math.abs((width / 2) * dx) + Math.abs((height / 2) * dy)
  if (halfLength === 0) return 0.5

  const px = x - width / 2
  const py = y - height / 2
  const projection = px * dx + py * dy

  return Math.max(0, Math.min(1, (projection + halfLength) / (2 * halfLength)))
}

/**
 * Radial gradient: normalized Euclidean distance from center.
 * Supports ellipses via separate rx/ry.
 */
export function radialGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  rx: number, ry: number
): number {
  if (rx === 0 || ry === 0) return 1
  const ndx = (x - cx) / rx
  const ndy = (y - cy) / ry
  return Math.max(0, Math.min(1, Math.sqrt(ndx * ndx + ndy * ndy)))
}

/**
 * Conic gradient: atan2-based angle from center.
 * CSS convention: 0deg = top, clockwise.
 */
export function conicGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  startAngleDeg: number
): number {
  const startRad = (startAngleDeg * Math.PI) / 180
  let theta = Math.atan2(x - cx, -(y - cy))
  theta -= startRad
  const TWO_PI = Math.PI * 2
  theta = ((theta % TWO_PI) + TWO_PI) % TWO_PI
  return theta / TWO_PI
}

/**
 * Diamond gradient: Manhattan distance (L1 norm) from center.
 */
export function diamondGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  rx: number, ry: number
): number {
  if (rx === 0 || ry === 0) return 1
  const ndx = Math.abs(x - cx) / rx
  const ndy = Math.abs(y - cy) / ry
  return Math.max(0, Math.min(1, ndx + ndy))
}

/**
 * Reflected gradient: linear that mirrors at midpoint (0 -> 1 -> 0).
 */
export function reflectedGradientValue(
  x: number, y: number,
  width: number, height: number,
  angleDeg: number
): number {
  const tLinear = linearGradientValue(x, y, width, height, angleDeg)
  return 1 - Math.abs(2 * tLinear - 1)
}

/**
 * Unified dispatcher: evaluates the gradient distance function at (x, y).
 */
export function gradientValue(
  x: number, y: number,
  width: number, height: number,
  type: DitherGradientType,
  angleDeg: number,
  cx: number, cy: number,
  rx: number, ry: number,
  startAngleDeg: number
): number {
  switch (type) {
    case 'linear':
      return linearGradientValue(x, y, width, height, angleDeg)
    case 'radial':
      return radialGradientValue(x, y, cx, cy, rx, ry)
    case 'conic':
      return conicGradientValue(x, y, cx, cy, startAngleDeg)
    case 'diamond':
      return diamondGradientValue(x, y, cx, cy, rx, ry)
    case 'reflected':
      return reflectedGradientValue(x, y, width, height, angleDeg)
    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown gradient type: ${_exhaustive}`)
    }
  }
}
