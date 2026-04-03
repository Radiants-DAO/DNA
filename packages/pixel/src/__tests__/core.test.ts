import { describe, expect, it } from 'vitest';

import {
  bitsToGrid,
  diffBits,
  gridFromHex,
  mirrorH,
  mirrorV,
  parseBits,
  validateGrid,
} from '../core';

describe('parseBits', () => {
  it('converts bitstring to Uint8Array', () => {
    const result = parseBits('10110100');
    expect(result).toEqual(new Uint8Array([1, 0, 1, 1, 0, 1, 0, 0]));
  });

  it('throws on invalid characters', () => {
    expect(() => parseBits('102')).toThrow('Invalid bitstring');
  });

  it('handles empty string', () => {
    expect(parseBits('')).toEqual(new Uint8Array(0));
  });
});

describe('validateGrid', () => {
  it('passes for valid grid', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 2, height: 2, bits: '1010' }),
    ).not.toThrow();
  });

  it('throws when bits length mismatches dimensions', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 2, height: 2, bits: '101' }),
    ).toThrow('bits length 3 !== width(2) × height(2) = 4');
  });

  it('throws when dimensions are not integers', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 1.5, height: 2, bits: '101' }),
    ).toThrow('width must be a positive integer');
  });

  it('throws when width is zero', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 0, height: 1, bits: '' }),
    ).toThrow('width must be a positive integer');
  });

  it('throws when height is zero', () => {
    expect(() =>
      validateGrid({ name: 'test', width: 1, height: 0, bits: '' }),
    ).toThrow('height must be a positive integer');
  });
});

describe('bitsToGrid', () => {
  it('rejects invalid bitstrings during construction', () => {
    expect(() => bitsToGrid('bad', 2, 2, '10x0')).toThrow('Invalid bitstring');
  });
});

describe('gridFromHex', () => {
  it('converts pattern hex to PixelGrid', () => {
    const grid = gridFromHex('checker', 8, 'AA 55 AA 55 AA 55 AA 55');
    expect(grid.width).toBe(8);
    expect(grid.height).toBe(8);
    expect(grid.bits.length).toBe(64);
    expect(grid.bits.slice(0, 8)).toBe('10101010');
    expect(grid.bits.slice(8, 16)).toBe('01010101');
  });

  it('throws on invalid hex bytes', () => {
    expect(() =>
      gridFromHex('bad', 8, 'GG GG GG GG GG GG GG GG'),
    ).toThrow('Invalid hex byte: GG');
  });
});

describe('mirrorH', () => {
  it('mirrors grid horizontally', () => {
    const grid = bitsToGrid('mirror-test', 4, 2, '10001100');
    const mirrored = mirrorH(grid);
    expect(mirrored.bits).toBe('00010011');
  });
});

describe('mirrorV', () => {
  it('mirrors grid vertically', () => {
    const grid = bitsToGrid('mirror-test', 4, 2, '10001100');
    const mirrored = mirrorV(grid);
    expect(mirrored.bits).toBe('11001000');
  });
});

describe('diffBits', () => {
  it('returns indices of bits that differ', () => {
    const a = '11001100';
    const b = '10011001';
    expect(diffBits(a, b)).toEqual([1, 3, 5, 7]);
  });

  it('returns empty array for identical strings', () => {
    expect(diffBits('1010', '1010')).toEqual([]);
  });

  it('throws for unequal bitstring lengths', () => {
    expect(() => diffBits('1', '10')).toThrow(
      'Bitstrings must have equal length',
    );
  });
});
