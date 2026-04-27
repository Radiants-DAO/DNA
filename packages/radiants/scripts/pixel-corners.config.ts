import {
  prepareCornerProfile,
  type CornerShapeName,
  type PreparedCornerProfile,
} from '@rdna/pixel/corners';

export type PixelCornerSizeEntry = {
  readonly suffix: string;
  readonly gridSize: number;
  readonly radiusPx: number;
};

export const NUMERIC_SIZES = [
  { suffix: '2', gridSize: 2, radiusPx: 1 },
  { suffix: '4', gridSize: 4, radiusPx: 3 },
  { suffix: '6', gridSize: 6, radiusPx: 5 },
  { suffix: '8', gridSize: 8, radiusPx: 7 },
  { suffix: '12', gridSize: 12, radiusPx: 11 },
  { suffix: '16', gridSize: 16, radiusPx: 15 },
  { suffix: '20', gridSize: 20, radiusPx: 19 },
  { suffix: '24', gridSize: 24, radiusPx: 23 },
  { suffix: '32', gridSize: 32, radiusPx: 31 },
  { suffix: '40', gridSize: 40, radiusPx: 39 },
  { suffix: '48', gridSize: 48, radiusPx: 47 },
  { suffix: '64', gridSize: 64, radiusPx: 63 },
] as const satisfies readonly PixelCornerSizeEntry[];

export const FULL_SIZE = {
  suffix: 'full',
  gridSize: 20,
  radiusPx: 19,
} as const satisfies PixelCornerSizeEntry;

export function getPresetSizes(): PixelCornerSizeEntry[] {
  return [...NUMERIC_SIZES, FULL_SIZE];
}

export function generateSizeData(
  gridSize: number,
  shape: CornerShapeName = 'circle',
): {
  gridSize: number;
  radiusPx: number;
  profile: PreparedCornerProfile;
} {
  const radiusPx = gridSize - 1;

  return {
    gridSize,
    radiusPx,
    profile: prepareCornerProfile(shape, radiusPx),
  };
}
