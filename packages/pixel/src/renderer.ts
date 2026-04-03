import { parseBits } from './core.js';
import type { PixelGrid } from './types.js';

const parsedGridCache = new WeakMap<PixelGrid, Uint8Array>();

function getParsed(grid: PixelGrid): Uint8Array {
  const cached = parsedGridCache.get(grid);
  if (cached) {
    return cached;
  }

  const parsed = parseBits(grid.bits);
  parsedGridCache.set(grid, parsed);
  return parsed;
}

/**
 * Paint a PixelGrid onto a canvas context.
 */
export function paintGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  color: string,
  pixelSize: number,
): void {
  const parsed = getParsed(grid);
  ctx.fillStyle = color;

  for (let i = 0; i < parsed.length; i++) {
    if (!parsed[i]) {
      continue;
    }

    const x = (i % grid.width) * pixelSize;
    const y = Math.floor(i / grid.width) * pixelSize;
    ctx.fillRect(x, y, pixelSize, pixelSize);
  }
}

/**
 * Paint a grid tiled across a CSS-pixel area.
 */
export function paintTiledGrid(
  ctx: CanvasRenderingContext2D,
  grid: PixelGrid,
  color: string,
  pixelSize: number,
  cssWidth: number,
  cssHeight: number,
): void {
  const parsed = getParsed(grid);
  const tileWidth = grid.width * pixelSize;
  const tileHeight = grid.height * pixelSize;
  ctx.fillStyle = color;

  for (let tileY = 0; tileY < cssHeight; tileY += tileHeight) {
    for (let tileX = 0; tileX < cssWidth; tileX += tileWidth) {
      for (let i = 0; i < parsed.length; i++) {
        if (!parsed[i]) {
          continue;
        }

        const x = tileX + (i % grid.width) * pixelSize;
        const y = tileY + Math.floor(i / grid.width) * pixelSize;
        if (x < cssWidth && y < cssHeight) {
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }
  }
}

/**
 * Create an offscreen canvas with a painted grid.
 */
export function createGridCanvas(
  grid: PixelGrid,
  color: string,
  pixelSize: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = grid.width * pixelSize;
  canvas.height = grid.height * pixelSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas context unavailable');
  }

  paintGrid(ctx, grid, color, pixelSize);
  return canvas;
}
