import { describe, expect, it } from 'vitest';

import * as pixel from '../index';
import { bitsToMaskURI, bitsToPath } from '../path';

describe('buildMaskAsset', () => {
  it('builds token-ready metadata from a PixelGrid', () => {
    const grid = pixel.bitsToGrid('spark', 2, 2, '1001');
    const asset = pixel.buildMaskAsset(grid);

    expect(asset).toEqual({
      maskImage: bitsToMaskURI(bitsToPath(grid.bits, grid.width, grid.height), grid.width),
      maskWidth: 2,
      maskHeight: 2,
    });
  });
});

describe('maskHostStyle', () => {
  it('emits static icon mask styles without tiling', () => {
    const grid = pixel.bitsToGrid('spark', 2, 2, '1001');
    const asset = pixel.buildMaskAsset(grid);

    expect(pixel.maskHostStyle(asset)).toEqual({
      WebkitMaskImage: asset.maskImage,
      maskImage: asset.maskImage,
      WebkitMaskSize: '2px 2px',
      maskSize: '2px 2px',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      width: '2px',
      height: '2px',
    });
  });

  it('emits tiled mask styles when repeat is enabled', () => {
    const grid = pixel.bitsToGrid('checker', 2, 2, '1001');
    const asset = pixel.buildMaskAsset(grid);

    expect(pixel.maskHostStyle(asset, { tiled: true, scale: 4 })).toEqual({
      WebkitMaskImage: asset.maskImage,
      maskImage: asset.maskImage,
      WebkitMaskSize: '8px 8px',
      maskSize: '8px 8px',
      WebkitMaskRepeat: 'repeat',
      maskRepeat: 'repeat',
    });
  });
});
