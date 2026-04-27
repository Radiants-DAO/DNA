import { bitsToMergedRects, type PixelGrid } from '@rdna/pixel';
import { BRAND_HEX, type BrandColor } from './colors';

export interface PatternDefOptions {
  id: string;
  fg: BrandColor;
  bg: BrandColor;
  /** Pixels per grid cell. Final tile = grid.width × cellSize square. */
  cellSize: number;
}

export function patternToSvgDef(
  grid: PixelGrid,
  { id, fg, bg, cellSize }: PatternDefOptions,
): string {
  const tile = grid.width * cellSize;
  const rects = bitsToMergedRects(grid.bits, grid.width, grid.height);
  const fgHex = BRAND_HEX[fg];
  const bgHex = BRAND_HEX[bg];
  const fgRects = rects
    .map(
      (r) =>
        `<rect x="${r.x * cellSize}" y="${r.y * cellSize}" width="${r.w * cellSize}" height="${r.h * cellSize}" fill="${fgHex}"/>`,
    )
    .join('');
  return (
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${tile}" height="${tile}">` +
    `<rect width="${tile}" height="${tile}" fill="${bgHex}"/>` +
    fgRects +
    `</pattern>`
  );
}
