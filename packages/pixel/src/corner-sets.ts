import type { PixelCornerSet } from './types.js';
import { generateCorner } from './generate.js';

/**
 * Preset corner sizes generated via Bresenham's midpoint circle algorithm.
 *
 * Each size maps to a circle radius. The grid size is (radius + 1)².
 * Cover and border grids are the mathematically correct quarter-circle
 * arc, with octant-seam smoothing applied.
 *
 * | Size | Radius | Grid   |
 * |------|--------|--------|
 * | xs   | 1      | 2×2    |
 * | sm   | 4      | 5×5    |
 * | md   | 8      | 9×9    |
 * | lg   | 11     | 12×12  |
 * | xl   | 18     | 19×19  |
 */

const RADII: Record<string, number> = {
  xs: 1,
  sm: 4,
  md: 8,
  lg: 11,
  xl: 18,
};

export const CORNER_SETS: Record<string, PixelCornerSet> = Object.fromEntries(
  Object.entries(RADII).map(([name, radius]) => {
    const set = generateCorner(radius);
    set.name = name;
    set.tl.name = `corner-${name}-cover`;
    if (set.border) set.border.name = `corner-${name}-border`;
    return [name, set];
  }),
);

export type CornerSize = keyof typeof RADII;

export function getCornerSet(size: string): PixelCornerSet | undefined {
  return CORNER_SETS[size];
}
