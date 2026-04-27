import { describe, expect, it } from 'vitest';

import { buildMaskAsset } from '../mask';
import { defaultDitherSteps, ditherBands } from '../dither/prepare';
import { bandDensity, bayerThresholdBits } from '../dither/ramp';

describe('defaultDitherSteps', () => {
  it('returns matrix² + 1 capped at 17', () => {
    expect(defaultDitherSteps(2)).toBe(5);
    expect(defaultDitherSteps(4)).toBe(17);
    expect(defaultDitherSteps(8)).toBe(17);
    expect(defaultDitherSteps(16)).toBe(17);
  });
});

describe('ditherBands', () => {
  it('emits one DitherBand per step, ordered top → bottom (dense first when down)', () => {
    const result = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    expect(result.bands).toHaveLength(5);
    expect(result.bands[0].density).toBe(1);
    expect(result.bands[4].density).toBe(0);
    for (let i = 0; i < 5; i++) {
      expect(result.bands[i].index).toBe(i);
    }
  });

  it('each band carries an n×n grid whose bits match bayerThresholdBits at that density', () => {
    const result = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    for (const band of result.bands) {
      expect(band.grid.width).toBe(4);
      expect(band.grid.height).toBe(4);
      expect(band.grid.bits).toBe(
        bayerThresholdBits({ matrix: 4, density: band.density }),
      );
    }
  });

  it('each band carries a mask matching buildMaskAsset(grid)', () => {
    const result = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    for (const band of result.bands) {
      expect(band.mask).toEqual(buildMaskAsset(band.grid));
    }
  });

  it("'up' direction reverses density progression", () => {
    const down = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    const up = ditherBands({ matrix: 4, steps: 5, direction: 'up' });
    expect(up.bands.map((b) => b.density)).toEqual(
      [...down.bands].map((b) => b.density).reverse(),
    );
  });

  it('caches by (matrix, steps, direction)', () => {
    const a = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    const b = ditherBands({ matrix: 4, steps: 5, direction: 'down' });
    expect(a).toBe(b);
    const c = ditherBands({ matrix: 4, steps: 5, direction: 'up' });
    expect(c).not.toBe(a);
  });

  it('band densities follow bandDensity(i, steps, direction) exactly', () => {
    const result = ditherBands({ matrix: 8, steps: 17, direction: 'down' });
    for (const band of result.bands) {
      expect(band.density).toBe(bandDensity(band.index, 17, 'down'));
    }
  });

  it('rejects non-positive step counts', () => {
    expect(() => ditherBands({ matrix: 4, steps: 0, direction: 'down' })).toThrow();
    expect(() => ditherBands({ matrix: 4, steps: -1, direction: 'down' })).toThrow();
    expect(() => ditherBands({ matrix: 4, steps: 1.5, direction: 'down' })).toThrow();
  });
});
