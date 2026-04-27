import { describe, it, expect } from 'vitest';
import { getPattern } from '@rdna/pixel';
import { patternToSvgDef } from '../patternDef';
import { BRAND_HEX } from '../colors';

describe('patternToSvgDef', () => {
  const grid = getPattern('checkerboard')!;

  it('returns a <pattern> with the given id', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toMatch(/<pattern[^>]+id="p1"/);
  });

  it('embeds the bg color as a full-tile rect', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    // Tile is 8 cells × 4px = 32px square
    expect(out).toContain(`fill="${BRAND_HEX.cream}"`);
    expect(out).toMatch(/width="32"\s+height="32"/);
  });

  it('emits fg cells using merged rects from @rdna/pixel', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toContain(`fill="${BRAND_HEX.ink}"`);
  });

  it('uses userSpaceOnUse so cellSize maps to absolute pixels', () => {
    const out = patternToSvgDef(grid, { id: 'p1', fg: 'ink', bg: 'cream', cellSize: 4 });
    expect(out).toContain('patternUnits="userSpaceOnUse"');
  });
});
