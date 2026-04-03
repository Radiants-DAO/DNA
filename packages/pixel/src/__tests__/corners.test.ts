import { describe, expect, it } from 'vitest';

import { bitsToGrid } from '../core';
import { CORNER_POSITIONS, getCornerStyle, mirrorForCorner } from '../corners';

describe('mirrorForCorner', () => {
  const tl = bitsToGrid('corner-tl', 3, 3, '110100000');

  it('returns original for tl', () => {
    expect(mirrorForCorner(tl, 'tl').bits).toBe('110100000');
  });

  it('mirrors horizontally for tr', () => {
    expect(mirrorForCorner(tl, 'tr').bits).toBe('011001000');
  });

  it('mirrors vertically for bl', () => {
    expect(mirrorForCorner(tl, 'bl').bits).toBe('000100110');
  });

  it('mirrors both for br', () => {
    expect(mirrorForCorner(tl, 'br').bits).toBe('000001011');
  });
});

describe('getCornerStyle', () => {
  it('returns correct absolute positioning for tl', () => {
    expect(getCornerStyle('tl', 4, 2)).toEqual({
      position: 'absolute',
      top: 0,
      left: 0,
      width: 8,
      height: 8,
    });
  });

  it('returns correct positioning for br', () => {
    expect(getCornerStyle('br', 4, 2)).toEqual({
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 8,
      height: 8,
    });
  });
});

describe('CORNER_POSITIONS', () => {
  it('lists all four corner positions in stable order', () => {
    expect(CORNER_POSITIONS).toEqual(['tl', 'tr', 'bl', 'br']);
  });
});
