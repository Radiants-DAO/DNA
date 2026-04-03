import { parseBits } from './core.js';
import type { PixelGrid } from './types.js';

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
