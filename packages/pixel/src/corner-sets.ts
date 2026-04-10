import type { PixelGrid, PixelCornerSet } from './types.js';

/**
 * Corner sets derived from pixel-corners.config.mjs profiles.
 * Each set has a cover grid (bg-colored, hides smooth CSS border-radius)
 * and a border grid (1px staircase edge).
 *
 * Grid convention:
 *   1 = opaque pixel (drawn)
 *   0 = transparent (shows element below)
 *
 * All grids represent the top-left corner. Other corners derived by mirroring.
 *
 * Rasterized from the clip-path polygon coordinates using boundary tracing:
 *   Cover = pixels outside the outer polygon boundary (clipped region)
 *   Border = pixels between outer and inner polygon boundaries (1px staircase edge)
 */

// ---------------------------------------------------------------------------
// xs: radius 2 — 2×2 grid
// ---------------------------------------------------------------------------
const XS_COVER: PixelGrid = {
  name: 'corner-xs-cover', width: 2, height: 2,
  bits:
    '11' +
    '10',
};
const XS_BORDER: PixelGrid = {
  name: 'corner-xs-border', width: 2, height: 2,
  bits:
    '00' +
    '01',
};

// ---------------------------------------------------------------------------
// sm: radius 4 — 5×5 grid
// ---------------------------------------------------------------------------
const SM_COVER: PixelGrid = {
  name: 'corner-sm-cover', width: 5, height: 5,
  bits:
    '11111' +
    '11100' +
    '11000' +
    '10000' +
    '10000',
};
const SM_BORDER: PixelGrid = {
  name: 'corner-sm-border', width: 5, height: 5,
  bits:
    '00000' +
    '00011' +
    '00100' +
    '01000' +
    '01000',
};

// ---------------------------------------------------------------------------
// md: radius 6 — 9×9 grid
// ---------------------------------------------------------------------------
const MD_COVER: PixelGrid = {
  name: 'corner-md-cover', width: 9, height: 9,
  bits:
    '111111111' +
    '111111000' +
    '111110000' +
    '111000000' +
    '111000000' +
    '110000000' +
    '100000000' +
    '100000000' +
    '100000000',
};
const MD_BORDER: PixelGrid = {
  name: 'corner-md-border', width: 9, height: 9,
  bits:
    '000000000' +
    '000000111' +
    '000001000' +
    '000110000' +
    '000100000' +
    '001000000' +
    '010000000' +
    '010000000' +
    '010000000',
};

// ---------------------------------------------------------------------------
// lg: radius 8 — 12×12 grid
// ---------------------------------------------------------------------------
const LG_COVER: PixelGrid = {
  name: 'corner-lg-cover', width: 12, height: 12,
  bits:
    '111111111111' +
    '111111111000' +
    '111111110000' +
    '111111000000' +
    '111100000000' +
    '111100000000' +
    '111000000000' +
    '111000000000' +
    '110000000000' +
    '100000000000' +
    '100000000000' +
    '100000000000',
};
const LG_BORDER: PixelGrid = {
  name: 'corner-lg-border', width: 12, height: 12,
  bits:
    '000000000000' +
    '000000000111' +
    '000000001000' +
    '000000110000' +
    '000011000000' +
    '000010000000' +
    '000100000000' +
    '000100000000' +
    '001000000000' +
    '010000000000' +
    '010000000000' +
    '010000000000',
};

// ---------------------------------------------------------------------------
// xl: radius 16 — 19×19 grid
// ---------------------------------------------------------------------------
const XL_COVER: PixelGrid = {
  name: 'corner-xl-cover', width: 19, height: 19,
  bits:
    '1111111111111111111' +
    '1111111111111111000' +
    '1111111111111000000' +
    '1111111111110000000' +
    '1111111111000000000' +
    '1111111110000000000' +
    '1111111100000000000' +
    '1111111000000000000' +
    '1111110000000000000' +
    '1111100000000000000' +
    '1111000000000000000' +
    '1111000000000000000' +
    '1110000000000000000' +
    '1100000000000000000' +
    '1100000000000000000' +
    '1100000000000000000' +
    '1000000000000000000' +
    '1000000000000000000' +
    '1000000000000000000',
};
const XL_BORDER: PixelGrid = {
  name: 'corner-xl-border', width: 19, height: 19,
  bits:
    '0000000000000000000' +
    '0000000000000000111' +
    '0000000000000111000' +
    '0000000000001000000' +
    '0000000000110000000' +
    '0000000001000000000' +
    '0000000010000000000' +
    '0000000100000000000' +
    '0000001000000000000' +
    '0000010000000000000' +
    '0000100000000000000' +
    '0000100000000000000' +
    '0001000000000000000' +
    '0010000000000000000' +
    '0010000000000000000' +
    '0010000000000000000' +
    '0100000000000000000' +
    '0100000000000000000' +
    '0100000000000000000',
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const CORNER_SETS: Record<string, PixelCornerSet> = {
  xs: { name: 'xs', tl: XS_COVER, border: XS_BORDER },
  sm: { name: 'sm', tl: SM_COVER, border: SM_BORDER },
  md: { name: 'md', tl: MD_COVER, border: MD_BORDER },
  lg: { name: 'lg', tl: LG_COVER, border: LG_BORDER },
  xl: { name: 'xl', tl: XL_COVER, border: XL_BORDER },
};

export type CornerSize = keyof typeof CORNER_SETS;

export function getCornerSet(size: string): PixelCornerSet | undefined {
  return CORNER_SETS[size];
}
