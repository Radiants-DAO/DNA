import { describe, expect, it } from 'vitest';

import {
  bandDensity,
  bayerThresholdBits,
  ditherRampBits,
} from '../dither/ramp';

describe('bayerThresholdBits', () => {
  it('density=0 produces an all-zero tile', () => {
    expect(bayerThresholdBits({ matrix: 4, density: 0 })).toMatch(/^0+$/);
  });

  it('density=1 produces an all-ones tile', () => {
    expect(bayerThresholdBits({ matrix: 4, density: 1 })).toMatch(/^1+$/);
  });

  it('matrix=2 with density=0.5 turns ON the two lowest-threshold cells', () => {
    // B_2 = [[0, 2], [3, 1]] → normalized = [[0.125, 0.625], [0.875, 0.375]]
    // density=0.5 > 0.125 → ON; > 0.375 → ON; > 0.625 → OFF; > 0.875 → OFF
    expect(bayerThresholdBits({ matrix: 2, density: 0.5 })).toBe('10' + '01');
  });

  it('throws for densities outside [0, 1]', () => {
    expect(() => bayerThresholdBits({ matrix: 4, density: -0.01 })).toThrow();
    expect(() => bayerThresholdBits({ matrix: 4, density: 1.01 })).toThrow();
  });
});

describe('bandDensity', () => {
  it('endpoints span [0, 1] inclusive when steps > 1', () => {
    expect(bandDensity(0, 5, 'down')).toBe(1);
    expect(bandDensity(4, 5, 'down')).toBe(0);
    expect(bandDensity(0, 5, 'up')).toBe(0);
    expect(bandDensity(4, 5, 'up')).toBe(1);
  });

  it('returns the dense extreme when steps=1', () => {
    expect(bandDensity(0, 1, 'down')).toBe(1);
    expect(bandDensity(0, 1, 'up')).toBe(0);
  });
});

describe('ditherRampBits', () => {
  it('emits a bitstring of length matrix² × steps', () => {
    for (const matrix of [2, 4, 8, 16] as const) {
      for (const steps of [1, 4, 17]) {
        const bits = ditherRampBits({ matrix, steps, direction: 'down' });
        expect(bits).toHaveLength(matrix * matrix * steps);
      }
    }
  });

  it("'down' direction emits the densest tile first", () => {
    const matrix = 4;
    const steps = 5;
    const bits = ditherRampBits({ matrix, steps, direction: 'down' });
    const tileSize = matrix * matrix;
    const firstTile = bits.slice(0, tileSize);
    const lastTile = bits.slice(-tileSize);
    expect([...firstTile].filter((c) => c === '1')).toHaveLength(tileSize);
    expect([...lastTile].filter((c) => c === '1')).toHaveLength(0);
  });

  it("'up' direction mirrors 'down' tile-by-tile", () => {
    const matrix = 4;
    const steps = 5;
    const tileSize = matrix * matrix;
    const down = ditherRampBits({ matrix, steps, direction: 'down' });
    const up = ditherRampBits({ matrix, steps, direction: 'up' });
    const downTiles = Array.from({ length: steps }, (_, i) =>
      down.slice(i * tileSize, (i + 1) * tileSize),
    );
    const upTiles = Array.from({ length: steps }, (_, i) =>
      up.slice(i * tileSize, (i + 1) * tileSize),
    );
    expect(upTiles).toEqual([...downTiles].reverse());
  });
});
