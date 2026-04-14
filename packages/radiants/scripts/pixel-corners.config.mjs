import { generateCorner, generateShape } from '@rdna/pixel';

/**
 * Numeric pixel-corner scale.
 *
 * Each entry maps a class suffix to a grid size.
 * Bresenham radius = gridSize - 1.
 *
 * The `shape` field is optional — defaults to 'circle' (Bresenham arc).
 * Set it to any registered shape name to use a different corner geometry:
 *   'circle' | 'chamfer' | 'notch' | 'scallop' | 'crenellation' | 'sawtooth' | 'octagon'
 *
 * The old t-shirt sizes (xs, sm, md, lg, xl) are kept as deprecated
 * backward-compat aliases — they generate from their original radii.
 */

/** @typedef {'circle' | 'chamfer' | 'notch' | 'scallop' | 'crenellation' | 'sawtooth' | 'octagon'} CornerShapeName */

/**
 * @typedef {Object} SizeEntry
 * @property {string} suffix - CSS class suffix (e.g. '8', 'chamfer-8')
 * @property {number} gridSize - N×N grid dimension
 * @property {CornerShapeName} [shape] - Corner shape (default: 'circle')
 */

/** @type {SizeEntry[]} */
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
  { suffix: 'xs', radius: 4 },   // grid 5  — matches PIXEL_BORDER_RADII.xs
  { suffix: 'sm', radius: 6 },   // grid 7  — matches PIXEL_BORDER_RADII.sm
  { suffix: 'md', radius: 8 },   // grid 9  — matches PIXEL_BORDER_RADII.md
  { suffix: 'lg', radius: 12 },  // grid 13 — matches PIXEL_BORDER_RADII.lg
  { suffix: 'xl', radius: 20 },  // grid 21 — matches PIXEL_BORDER_RADII.xl
];

/**
 * Alternate shape sizes — non-circle shapes at selected grid sizes.
 *
 * Each entry generates a class like `.pixel-chamfer-8`, `.pixel-notch-12`, etc.
 * The shape field is required here (no default to 'circle').
 *
 * @type {SizeEntry[]}
 */
export const SHAPE_SIZES = [
  // Chamfer (45° bevel)
  { suffix: 'chamfer-4', gridSize: 4, shape: 'chamfer' },
  { suffix: 'chamfer-6', gridSize: 6, shape: 'chamfer' },
  { suffix: 'chamfer-8', gridSize: 8, shape: 'chamfer' },
  { suffix: 'chamfer-12', gridSize: 12, shape: 'chamfer' },
  { suffix: 'chamfer-16', gridSize: 16, shape: 'chamfer' },

  // Notch (stepped rectangular cutout)
  { suffix: 'notch-4', gridSize: 4, shape: 'notch' },
  { suffix: 'notch-8', gridSize: 8, shape: 'notch' },
  { suffix: 'notch-12', gridSize: 12, shape: 'notch' },
  { suffix: 'notch-16', gridSize: 16, shape: 'notch' },

  // Scallop (concave arc)
  { suffix: 'scallop-6', gridSize: 6, shape: 'scallop' },
  { suffix: 'scallop-8', gridSize: 8, shape: 'scallop' },
  { suffix: 'scallop-12', gridSize: 12, shape: 'scallop' },
  { suffix: 'scallop-16', gridSize: 16, shape: 'scallop' },

  // Octagon (flat-diag-flat)
  { suffix: 'octagon-6', gridSize: 6, shape: 'octagon' },
  { suffix: 'octagon-8', gridSize: 8, shape: 'octagon' },
  { suffix: 'octagon-12', gridSize: 12, shape: 'octagon' },
  { suffix: 'octagon-16', gridSize: 16, shape: 'octagon' },

  // Sawtooth (zigzag)
  { suffix: 'sawtooth-6', gridSize: 6, shape: 'sawtooth' },
  { suffix: 'sawtooth-8', gridSize: 8, shape: 'sawtooth' },
  { suffix: 'sawtooth-12', gridSize: 12, shape: 'sawtooth' },

  // Crenellation (battlements)
  { suffix: 'crenellation-8', gridSize: 8, shape: 'crenellation' },
  { suffix: 'crenellation-12', gridSize: 12, shape: 'crenellation' },
  { suffix: 'crenellation-16', gridSize: 16, shape: 'crenellation' },
];

/**
 * Generate a corner set for a given grid size and shape.
 * @param {number} gridSize
 * @param {CornerShapeName} [shape='circle']
 * @returns {{ gridSize: number, radius: number, cornerSet: import('@rdna/pixel').PixelCornerSet }}
 */
export function generateSizeData(gridSize, shape = 'circle') {
  const radius = gridSize - 1;
  return {
    gridSize,
    radius,
    cornerSet: shape === 'circle'
      ? generateCorner(radius)
      : generateShape(shape, gridSize),
  };
}
