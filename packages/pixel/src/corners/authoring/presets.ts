import { generateCorner } from '../../generate.js';
import type { PixelCornerSet } from '../../types.js';

const RADII = {
  xs: 1,
  sm: 4,
  md: 8,
  lg: 11,
  xl: 18,
} as const;

export type CornerSize = keyof typeof RADII;

export const CORNER_SETS: Record<CornerSize, PixelCornerSet> = Object.fromEntries(
  Object.entries(RADII).map(([name, radius]) => {
    const set = generateCorner(radius);
    set.name = name;
    set.tl.name = `corner-${name}-cover`;
    if (set.border) {
      set.border.name = `corner-${name}-border`;
    }
    return [name, set];
  }),
) as Record<CornerSize, PixelCornerSet>;

export function getCornerSet(size: string): PixelCornerSet | undefined {
  return CORNER_SETS[size as CornerSize];
}
