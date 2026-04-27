import { describe, expect, it } from 'vitest';

import { bayerMatrix } from '../dither/bayer';

describe('bayerMatrix', () => {
  it('returns the canonical 2×2 base matrix', () => {
    expect(bayerMatrix(2)).toEqual([
      [0, 2],
      [3, 1],
    ]);
  });

  it('returns a 4×4 matrix matching the standard Bayer recursion', () => {
    // B_4[2i+u][2j+v] = 4 * B_2[i][j] + B_2[u][v]
    expect(bayerMatrix(4)).toEqual([
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]);
  });

  it('produces an n×n matrix for n in {2,4,8,16}', () => {
    for (const n of [2, 4, 8, 16] as const) {
      const m = bayerMatrix(n);
      expect(m).toHaveLength(n);
      for (const row of m) {
        expect(row).toHaveLength(n);
      }
    }
  });

  it('contains every integer from 0 to n²-1 exactly once', () => {
    for (const n of [2, 4, 8, 16] as const) {
      const m = bayerMatrix(n);
      const flat = m.flat().sort((a, b) => a - b);
      expect(flat).toEqual(Array.from({ length: n * n }, (_, i) => i));
    }
  });

  it('throws for non-power-of-two sizes', () => {
    expect(() => bayerMatrix(3 as 2)).toThrow();
    expect(() => bayerMatrix(0 as 2)).toThrow();
  });
});
