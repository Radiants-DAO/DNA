import { describe, expect, it } from 'vitest';

import { bitsToMaskURI, bitsToMergedRects, bitsToPath } from '../path';

describe('bitsToMergedRects', () => {
  it('finds horizontal runs in a 4×4 grid', () => {
    // Row 0: 1110 → run at x=0, w=3
    // Row 1: 0010 → run at x=2, w=1
    // Row 2: 1111 → run at x=0, w=4
    // Row 3: 0000 → no runs
    const bits = '1110001011110000';
    const rects = bitsToMergedRects(bits, 4, 4);

    expect(rects).toEqual([
      { x: 0, y: 0, w: 3, h: 1 },
      { x: 2, y: 1, w: 1, h: 1 },
      { x: 0, y: 2, w: 4, h: 1 },
    ]);
  });

  it('vertically merges adjacent runs with same x and width', () => {
    // Row 0: 1100
    // Row 1: 1100
    // Row 2: 0000
    // Row 3: 1100
    const bits = '1100110000001100';
    const rects = bitsToMergedRects(bits, 4, 4);

    expect(rects).toEqual([
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 0, y: 3, w: 2, h: 1 },
    ]);
  });

  it('returns empty array for all-zero grid', () => {
    const rects = bitsToMergedRects('0000', 2, 2);
    expect(rects).toEqual([]);
  });

  it('merges a full grid into a single rect', () => {
    const rects = bitsToMergedRects('111111111', 3, 3);

    expect(rects).toEqual([{ x: 0, y: 0, w: 3, h: 3 }]);
  });
});

describe('bitsToPath', () => {
  it('produces valid SVG path with M/h/v/Z commands', () => {
    // Single pixel at (0,0)
    const path = bitsToPath('1000', 2, 2);
    expect(path).toBe('M0,0h1v1h-1Z');
  });

  it('returns empty string for an empty grid', () => {
    const path = bitsToPath('0000000000000000', 4, 4);
    expect(path).toBe('');
  });

  it('returns a single rect path for a full grid', () => {
    const path = bitsToPath('1111', 2, 2);
    expect(path).toBe('M0,0h2v2h-2Z');
  });

  it('produces multiple path segments for disjoint runs', () => {
    // Row 0: 10
    // Row 1: 01
    const path = bitsToPath('1001', 2, 2);
    expect(path).toBe('M0,0h1v1h-1ZM1,1h1v1h-1Z');
  });
});

describe('bitsToMaskURI', () => {
  it('produces a data URI starting with url("data:image/svg+xml,', () => {
    const pathD = 'M0,0h2v2h-2Z';
    const uri = bitsToMaskURI(pathD, 8);

    expect(uri).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(uri).toMatch(/"\)$/);
  });

  it('includes the path d attribute in the SVG', () => {
    const pathD = 'M0,0h4v4h-4Z';
    const uri = bitsToMaskURI(pathD, 8);
    const decoded = decodeURIComponent(
      uri.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''),
    );

    expect(decoded).toContain(`d='${pathD}'`);
    expect(decoded).toContain("width='8'");
    expect(decoded).toContain("height='8'");
  });

  it('supports rectangular SVG viewports', () => {
    const pathD = 'M0,0h3v2h-3Z';
    const uri = bitsToMaskURI(pathD, 3, 2);
    const decoded = decodeURIComponent(
      uri.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''),
    );

    expect(decoded).toContain("width='3'");
    expect(decoded).toContain("height='2'");
    expect(decoded).toContain(`d='${pathD}'`);
  });

  it('includes transform attribute when provided', () => {
    const pathD = 'M0,0h2v2h-2Z';
    const uri = bitsToMaskURI(pathD, 8, 'scale(-1,1) translate(-8,0)');
    const decoded = decodeURIComponent(
      uri.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''),
    );

    expect(decoded).toContain('transform="scale(-1,1) translate(-8,0)"');
  });

  it('omits transform attribute when not provided', () => {
    const pathD = 'M0,0h2v2h-2Z';
    const uri = bitsToMaskURI(pathD, 8);
    const decoded = decodeURIComponent(
      uri.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''),
    );

    expect(decoded).not.toContain('transform');
  });
});
