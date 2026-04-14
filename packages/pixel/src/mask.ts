import { validateGrid } from './core.js';
import { bitsToMaskURI, bitsToPath } from './path.js';
import type { PixelGrid } from './types.js';

export interface MaskAsset {
  maskImage: string;
  maskWidth: number;
  maskHeight: number;
}

export interface MaskHostStyleOptions {
  tiled?: boolean;
  scale?: number;
}

export interface MaskHostStyle {
  WebkitMaskImage: string;
  maskImage: string;
  WebkitMaskSize: string;
  maskSize: string;
  WebkitMaskRepeat: 'repeat' | 'no-repeat';
  maskRepeat: 'repeat' | 'no-repeat';
  width?: string;
  height?: string;
}

/**
 * Build a reusable mask asset from a validated PixelGrid.
 */
export function buildMaskAsset(grid: PixelGrid): MaskAsset {
  validateGrid(grid);

  const pathD = bitsToPath(grid.bits, grid.width, grid.height);

  return {
    maskImage: bitsToMaskURI(pathD, grid.width),
    maskWidth: grid.width,
    maskHeight: grid.height,
  };
}

/**
 * Convert a mask asset into host CSS for either a single icon or a tiled mask.
 */
export function maskHostStyle(
  asset: MaskAsset,
  options: MaskHostStyleOptions = {},
): MaskHostStyle {
  const scale = options.scale ?? 1;
  const maskWidth = asset.maskWidth * scale;
  const maskHeight = asset.maskHeight * scale;
  const maskSize = `${maskWidth}px ${maskHeight}px`;
  const maskRepeat: 'repeat' | 'no-repeat' = options.tiled ? 'repeat' : 'no-repeat';

  const style: MaskHostStyle = {
    WebkitMaskImage: asset.maskImage,
    maskImage: asset.maskImage,
    WebkitMaskSize: maskSize,
    maskSize,
    WebkitMaskRepeat: maskRepeat,
    maskRepeat,
  };

  if (!options.tiled) {
    style.width = `${maskWidth}px`;
    style.height = `${maskHeight}px`;
  }

  return style;
}
