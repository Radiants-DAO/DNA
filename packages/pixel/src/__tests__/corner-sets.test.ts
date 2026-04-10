import { describe, it, expect } from 'vitest';
import { CORNER_SETS, getCornerSet } from '../corner-sets.js';
import { validateGrid } from '../core.js';

describe('CORNER_SETS', () => {
  it('has 5 sizes', () => {
    expect(Object.keys(CORNER_SETS)).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  it('each cover grid has valid dimensions', () => {
    for (const set of Object.values(CORNER_SETS)) {
      expect(() => validateGrid(set.tl)).not.toThrow();
    }
  });

  it('each border grid matches cover grid dimensions', () => {
    for (const set of Object.values(CORNER_SETS)) {
      if (set.border) {
        expect(set.border.width).toBe(set.tl.width);
        expect(set.border.height).toBe(set.tl.height);
        expect(set.border.bits.length).toBe(set.tl.bits.length);
      }
    }
  });

  it('cover and border grids do not overlap', () => {
    for (const [name, set] of Object.entries(CORNER_SETS)) {
      if (!set.border) continue;
      for (let i = 0; i < set.tl.bits.length; i++) {
        if (set.tl.bits[i] === '1' && set.border.bits[i] === '1') {
          throw new Error(`${name}: cover and border overlap at index ${i}`);
        }
      }
    }
  });

  it('xs border has expected Bresenham shape', () => {
    const xs = getCornerSet('xs');
    expect(xs).toBeDefined();
    // R=1 Bresenham: arc fills the grid, no cover pixels
    expect(xs!.border!.bits).toBe('11' + '10');
  });

  it('sm border starts at row 0 (Bresenham arc enters at top)', () => {
    const sm = getCornerSet('sm');
    expect(sm).toBeDefined();
    // R=4 Bresenham: 3 border pixels at top row
    const topRow = sm!.border!.bits.slice(0, 5);
    expect(topRow).toBe('00111');
  });

  it('md cover grid is 9×9', () => {
    const md = getCornerSet('md');
    expect(md).toBeDefined();
    expect(md!.tl.width).toBe(9);
    expect(md!.tl.height).toBe(9);
    expect(md!.tl.bits.length).toBe(81);
  });

  it('lg cover grid is 12×12', () => {
    const lg = getCornerSet('lg');
    expect(lg).toBeDefined();
    expect(lg!.tl.width).toBe(12);
    expect(lg!.tl.height).toBe(12);
  });

  it('xl cover grid is 19×19', () => {
    const xl = getCornerSet('xl');
    expect(xl).toBeDefined();
    expect(xl!.tl.width).toBe(19);
    expect(xl!.tl.height).toBe(19);
    expect(xl!.tl.bits.length).toBe(361);
  });
});
