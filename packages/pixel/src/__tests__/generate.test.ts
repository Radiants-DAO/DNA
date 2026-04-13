import { describe, it, expect } from 'vitest';
import { generateCorner } from '../generate.js';
import { validateGrid } from '../core.js';

describe('generateCorner', () => {
  it('throws for non-positive radius', () => {
    expect(() => generateCorner(0)).toThrow();
    expect(() => generateCorner(-1)).toThrow();
    expect(() => generateCorner(1.5)).toThrow();
  });

  it('generates R=1 (2×2) — arc fills entire grid', () => {
    const set = generateCorner(1);
    expect(set.tl.width).toBe(2);
    expect(set.tl.height).toBe(2);
    // R=1 is too small for any pixel to be fully outside the arc.
    // Cover is empty, border is the arc itself.
    expect(set.tl.bits).toBe('0000');
    expect(set.border!.bits).toBe(
      '11' +
      '10',
    );
  });

  it('generates R=8 (9×9) matching the Figma reference', () => {
    const set = generateCorner(8);
    expect(set.tl.width).toBe(9);

    // Border should be clean staircase: 3-2-1-1-1-1-1-1-1
    const borderRows = [];
    for (let r = 0; r < 9; r++) {
      const row = set.border!.bits.slice(r * 9, (r + 1) * 9);
      borderRows.push(row.split('').filter((b) => b === '1').length);
    }
    expect(borderRows).toEqual([3, 2, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('generates valid grids for all radii 1-20', () => {
    for (let r = 1; r <= 20; r++) {
      const set = generateCorner(r);
      expect(set.tl.width).toBe(r + 1);
      expect(set.tl.height).toBe(r + 1);
      expect(() => validateGrid(set.tl)).not.toThrow();
      expect(() => validateGrid(set.border!)).not.toThrow();
    }
  });

  it('cover and border never overlap', () => {
    for (let r = 1; r <= 20; r++) {
      const set = generateCorner(r);
      for (let i = 0; i < set.tl.bits.length; i++) {
        if (set.tl.bits[i] === '1' && set.border!.bits[i] === '1') {
          throw new Error(`R=${r}: overlap at index ${i}`);
        }
      }
    }
  });

  it('border staircase is 8-connected (no gaps between adjacent rows)', () => {
    for (let r = 1; r <= 64; r++) {
      const set = generateCorner(r);
      const N = r + 1;
      let prevCols: number[] | null = null;

      for (let row = 0; row < N; row++) {
        const cols: number[] = [];
        for (let col = 0; col < N; col++) {
          if (set.border!.bits[row * N + col] === '1') cols.push(col);
        }
        if (cols.length === 0) { prevCols = null; continue; }

        if (prevCols !== null) {
          const prevSet = new Set(prevCols);
          const connected = cols.some(
            (c) => prevSet.has(c - 1) || prevSet.has(c) || prevSet.has(c + 1),
          );
          expect(connected).toBe(true);
        }
        prevCols = cols;
      }
    }
  });

  it('smooths the octant-seam kink for R=11 (12×12)', () => {
    const set = generateCorner(11);
    const N = 12;
    // Row 3 should NOT have 2 border pixels (that was the kink)
    const row3 = set.border!.bits.slice(3 * N, 4 * N);
    const count = row3.split('').filter((b) => b === '1').length;
    expect(count).toBe(1);
  });
});
