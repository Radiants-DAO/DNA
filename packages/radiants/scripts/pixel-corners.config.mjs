import { generateCorner } from '@rdna/pixel';

/**
 * Numeric pixel-corner scale.
 *
 * Each entry maps a class suffix to a grid size.
 * Bresenham radius = gridSize - 1.
 *
 * The old t-shirt sizes (xs, sm, md, lg, xl) are kept as deprecated
 * backward-compat aliases — they generate from their original radii.
 */

export const NUMERIC_SIZES = [
  { suffix: '2', gridSize: 2 },
  { suffix: '4', gridSize: 4 },
  { suffix: '6', gridSize: 6 },
  { suffix: '8', gridSize: 8 },
  { suffix: '12', gridSize: 12 },
  { suffix: '16', gridSize: 16 },
  { suffix: '20', gridSize: 20 },
  { suffix: '24', gridSize: 24 },
  { suffix: '32', gridSize: 32 },
  { suffix: '40', gridSize: 40 },
  { suffix: '48', gridSize: 48 },
  { suffix: '64', gridSize: 64 },
];

/** pixel-rounded-full is the canonical 20×20 pixel circle. */
export const FULL_SIZE = { suffix: 'full', gridSize: 20 };

/**
 * Deprecated t-shirt aliases (backward compat during migration).
 * These generate from the ORIGINAL radii, not mapped to the new numeric scale.
 */
export const LEGACY_ALIASES = [
  { suffix: 'xs', radius: 1 },   // grid 2
  { suffix: 'sm', radius: 4 },   // grid 5
  { suffix: 'md', radius: 8 },   // grid 9
  { suffix: 'lg', radius: 11 },  // grid 12
  { suffix: 'xl', radius: 18 },  // grid 19
];

/**
 * Generate a corner set for a given grid size.
 * @param {number} gridSize
 * @returns {{ gridSize: number, radius: number, cornerSet: import('@rdna/pixel').PixelCornerSet }}
 */
export function generateSizeData(gridSize) {
  const radius = gridSize - 1;
  return {
    gridSize,
    radius,
    cornerSet: generateCorner(radius),
  };
}
