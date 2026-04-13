import { parseBits } from './core.js';
import type { PixelGrid } from './types.js';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * @deprecated Use `bitsToMergedRects` from `@rdna/pixel` instead.
 * This function emits one rect per filled bit with no merging,
 * producing ~400 DOM nodes for typical corner grids.
 * `bitsToMergedRects` produces far fewer merged rectangles.
 *
 * Retained for `Pattern` component (small 8×8 tiled grids where
 * per-cell rects are acceptable).
 */
export function listFilledRects(
  grid: PixelGrid,
  pixelSize = 1,
): PixelRect[] {
  if (!Number.isFinite(pixelSize) || pixelSize <= 0) {
    throw new Error(`pixelSize must be greater than 0, received ${pixelSize}`);
  }

  const bits = parseBits(grid.bits);
  const rects: PixelRect[] = [];

  for (let i = 0; i < bits.length; i++) {
    if (!bits[i]) {
      continue;
    }

    rects.push({
      x: (i % grid.width) * pixelSize,
      y: Math.floor(i / grid.width) * pixelSize,
      width: pixelSize,
      height: pixelSize,
    });
  }

  return rects;
}
