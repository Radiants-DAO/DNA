import { describe, expect, it } from 'vitest';

import {
  extractPatternEntries,
  hexToBitstring,
} from '../convert-patterns';

describe('extractPatternEntries', () => {
  it('extracts multiline entries with mixed quote styles', () => {
    const registry = `
      export const patternRegistry = [
        {
          name: "solid",
          group: 'structural',
          hex: "FF FF FF FF FF FF FF FF",
        },
        {
          group: 'structural',
          name: 'checkerboard',
          fill: 50,
          hex:
            'AA 55 AA 55 AA 55 AA 55',
        },
      ];
    `;

    expect(extractPatternEntries(registry)).toEqual([
      { name: 'solid', bits: '1'.repeat(64) },
      {
        name: 'checkerboard',
        bits: '1010101001010101101010100101010110101010010101011010101001010101',
      },
    ]);
  });
});

describe('hexToBitstring', () => {
  it('throws when the pattern is not 8 bytes wide', () => {
    expect(() => hexToBitstring('FF FF FF FF')).toThrow(
      'Expected 8 hex bytes, received 4',
    );
  });
});
