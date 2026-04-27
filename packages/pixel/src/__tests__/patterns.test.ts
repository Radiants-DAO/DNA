import { describe, expect, it } from 'vitest';

import { getPattern, PATTERN_REGISTRY, preparePatterns } from '../patterns';

const EXPECTED_PATTERN_FILLS = {
  solid: 100,
  empty: 0,
  checkerboard: 50,
  'checkerboard-alt': 50,
  'pinstripe-v': 50,
  'pinstripe-v-wide': 25,
  'pinstripe-h': 50,
  'pinstripe-h-wide': 25,
  diagonal: 12,
  'diagonal-dots': 25,
  'diagonal-right': 25,
  grid: 44,
  brick: 34,
  shelf: 23,
  columns: 25,
  stagger: 25,
  diamond: 25,
  confetti: 38,
  weave: 47,
  'brick-diagonal': 20,
  'brick-diagonal-alt': 20,
  caret: 23,
  trellis: 25,
  arch: 22,
  cross: 22,
  sawtooth: 28,
  chevron: 31,
  basket: 52,
  tweed: 59,
  dust: 2,
  mist: 3,
  scatter: 6,
  'scatter-alt': 6,
  'scatter-pair': 6,
  rain: 9,
  'rain-cluster': 9,
  spray: 12,
  'spray-grid': 12,
  'spray-mixed': 12,
  'fill-75': 75,
  'fill-75-rows': 75,
  'fill-75-sweep': 75,
  'fill-75-offset': 75,
  'fill-75-inv': 75,
  'fill-75-bars': 75,
  'fill-81': 81,
  'fill-88': 88,
  'fill-88-alt': 88,
  'fill-94': 94,
  'fill-94-alt': 94,
  'fill-97': 97,
} as const;

const EXPECTED_PATTERN_BIT_ROWS = [
  { name: 'solid', rows: ['11111111', '11111111', '11111111', '11111111', '11111111', '11111111', '11111111', '11111111'] },
  { name: 'empty', rows: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'] },
  { name: 'checkerboard', rows: ['10101010', '01010101', '10101010', '01010101', '10101010', '01010101', '10101010', '01010101'] },
  { name: 'checkerboard-alt', rows: ['01010101', '10101010', '01010101', '10101010', '01010101', '10101010', '01010101', '10101010'] },
  { name: 'pinstripe-v', rows: ['10101010', '10101010', '10101010', '10101010', '10101010', '10101010', '10101010', '10101010'] },
  { name: 'pinstripe-v-wide', rows: ['10001000', '10001000', '10001000', '10001000', '10001000', '10001000', '10001000', '10001000'] },
  { name: 'pinstripe-h', rows: ['11111111', '00000000', '11111111', '00000000', '11111111', '00000000', '11111111', '00000000'] },
  { name: 'pinstripe-h-wide', rows: ['11111111', '00000000', '00000000', '00000000', '11111111', '00000000', '00000000', '00000000'] },
  { name: 'diagonal', rows: ['00000001', '00000010', '00000100', '00001000', '00010000', '00100000', '01000000', '10000000'] },
  { name: 'diagonal-dots', rows: ['10001000', '00100010', '10001000', '00100010', '10001000', '00100010', '10001000', '00100010'] },
  { name: 'diagonal-right', rows: ['00010001', '00100010', '01000100', '10001000', '00010001', '00100010', '01000100', '10001000'] },
  { name: 'grid', rows: ['11111111', '10001000', '10001000', '10001000', '11111111', '10001000', '10001000', '10001000'] },
  { name: 'brick', rows: ['11111111', '10000000', '10000000', '10000000', '11111111', '00001000', '00001000', '00001000'] },
  { name: 'shelf', rows: ['11111111', '10000000', '10000000', '10000000', '10000000', '10000000', '10000000', '10000000'] },
  { name: 'columns', rows: ['10101010', '00000000', '10101010', '00000000', '10101010', '00000000', '10101010', '00000000'] },
  { name: 'stagger', rows: ['01000100', '00010001', '01000100', '00010001', '01000100', '00010001', '01000100', '00010001'] },
  { name: 'diamond', rows: ['00000000', '00001000', '00010100', '00101010', '01010101', '00101010', '00010100', '00001000'] },
  { name: 'confetti', rows: ['10110001', '00110000', '00000011', '00011011', '11011000', '11000000', '00001100', '10001101'] },
  { name: 'weave', rows: ['11111000', '01110100', '00100010', '01000111', '10001111', '00010111', '00100010', '01110001'] },
  { name: 'brick-diagonal', rows: ['00001000', '00011100', '00100010', '11000001', '10000000', '00000001', '00000010', '00000100'] },
  { name: 'brick-diagonal-alt', rows: ['00000011', '10000100', '01001000', '00110000', '00001100', '00000010', '00000001', '00000001'] },
  { name: 'caret', rows: ['10000010', '01000100', '00111001', '01000100', '10000010', '00000001', '00000001', '00000001'] },
  { name: 'trellis', rows: ['01010101', '10100000', '01000000', '01000000', '01010101', '00001010', '00000100', '00000100'] },
  { name: 'arch', rows: ['00100000', '01010000', '10001000', '10001000', '10001000', '10001000', '00000101', '00000010'] },
  { name: 'cross', rows: ['10001000', '00010100', '00100010', '01000001', '10001000', '00000000', '10101010', '00000000'] },
  { name: 'sawtooth', rows: ['10000000', '10000000', '01000001', '00111110', '00001000', '00001000', '00010100', '11100011'] },
  { name: 'chevron', rows: ['00010000', '00100000', '01010100', '10101010', '11111111', '00000010', '00000100', '00001000'] },
  { name: 'basket', rows: ['10111111', '00000000', '10111111', '10111111', '10110000', '10110000', '10110000', '10110000'] },
  { name: 'tweed', rows: ['01110111', '10001001', '10001111', '10001111', '01110111', '10011000', '11111000', '11111000'] },
  { name: 'dust', rows: ['10000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'] },
  { name: 'mist', rows: ['10000000', '00000000', '00000000', '00000000', '00001000', '00000000', '00000000', '00000000'] },
  { name: 'scatter', rows: ['01000000', '00000000', '00000100', '00000000', '01000000', '00000000', '00000100', '00000000'] },
  { name: 'scatter-alt', rows: ['10000000', '00000000', '00001000', '00000000', '10000000', '00000000', '00001000', '00000000'] },
  { name: 'scatter-pair', rows: ['00000000', '00000000', '00000000', '00010001', '00000000', '00000000', '00000000', '00010001'] },
  { name: 'rain', rows: ['10000000', '01000000', '00100000', '00000000', '00000010', '00000100', '00001000', '00000000'] },
  { name: 'rain-cluster', rows: ['01000000', '10100000', '00000000', '00000000', '00000100', '00001010', '00000000', '00000000'] },
  { name: 'spray', rows: ['10000000', '00010000', '00000010', '00100000', '00000001', '00001000', '01000000', '00000100'] },
  { name: 'spray-grid', rows: ['10001000', '00000000', '00100010', '00000000', '10001000', '00000000', '00100010', '00000000'] },
  { name: 'spray-mixed', rows: ['10101010', '00000000', '10000000', '00000000', '10001000', '00000000', '10000000', '00000000'] },
  { name: 'fill-75', rows: ['11011101', '01110111', '11011101', '01110111', '11011101', '01110111', '11011101', '01110111'] },
  { name: 'fill-75-rows', rows: ['01010101', '11111111', '01010101', '11111111', '01010101', '11111111', '01010101', '11111111'] },
  { name: 'fill-75-sweep', rows: ['11101110', '11011101', '10111011', '01110111', '11101110', '11011101', '10111011', '01110111'] },
  { name: 'fill-75-offset', rows: ['10111011', '11101110', '10111011', '11101110', '10111011', '11101110', '10111011', '11101110'] },
  { name: 'fill-75-inv', rows: ['01110111', '11011101', '01110111', '11011101', '01110111', '11011101', '01110111', '11011101'] },
  { name: 'fill-75-bars', rows: ['11111111', '01010101', '11111111', '01010101', '11111111', '01010101', '11111111', '01010101'] },
  { name: 'fill-81', rows: ['11111111', '01110111', '11011101', '01110111', '11111111', '01110111', '11011101', '01110111'] },
  { name: 'fill-88', rows: ['11011101', '11111111', '01110111', '11111111', '11011101', '11111111', '01110111', '11111111'] },
  { name: 'fill-88-alt', rows: ['01110111', '11111111', '11011101', '11111111', '01110111', '11111111', '11011101', '11111111'] },
  { name: 'fill-94', rows: ['11111111', '11110111', '11111111', '01111111', '11111111', '11110111', '11111111', '01111111'] },
  { name: 'fill-94-alt', rows: ['01111111', '11111111', '11110111', '11111111', '01111111', '11111111', '11110111', '11111111'] },
  { name: 'fill-97', rows: ['01111111', '11111111', '11111111', '11111111', '11110111', '11111111', '11111111', '11111111'] },
] as const;

function patternBitRows(bits: string) {
  return bits.match(/.{1,8}/g) ?? [];
}

describe('PATTERN_REGISTRY', () => {
  it('contains the full canonical pattern set, including solid and empty', () => {
    expect(PATTERN_REGISTRY).toHaveLength(51);
    expect(getPattern('solid')).toBeDefined();
    expect(getPattern('empty')).toBeDefined();
  });

  it('each pattern has bits matching width × height', () => {
    for (const pattern of PATTERN_REGISTRY) {
      expect(pattern.bits).toHaveLength(pattern.width * pattern.height);
    }
  });

  it('each pattern is 8×8', () => {
    for (const pattern of PATTERN_REGISTRY) {
      expect(pattern.width).toBe(8);
      expect(pattern.height).toBe(8);
    }
  });

  it('keeps the authored registry free of duplicated prepared fields', () => {
    for (const pattern of PATTERN_REGISTRY) {
      expect(pattern).not.toHaveProperty('fill');
      expect(pattern).not.toHaveProperty('token');
      expect(pattern).not.toHaveProperty('path');
      expect(pattern).not.toHaveProperty('maskImage');
    }
  });

  it('matches the legacy fill percentages exactly once patterns are prepared', () => {
    expect(
      Object.fromEntries(
        preparePatterns().map((pattern) => [pattern.name, pattern.fill]),
      ),
    ).toEqual(EXPECTED_PATTERN_FILLS);
  });

  it.each(EXPECTED_PATTERN_BIT_ROWS)(
    'keeps authored bit rows review-visible for $name',
    ({ name, rows }) => {
      expect(patternBitRows(getPattern(name)!.bits)).toEqual(rows);
    },
  );

  it('checkerboard alternates correctly', () => {
    const checkerboard = getPattern('checkerboard');
    expect(checkerboard).toBeDefined();
    expect(checkerboard?.bits.slice(0, 8)).toBe('10101010');
    expect(checkerboard?.bits.slice(8, 16)).toBe('01010101');
  });

  it('resolves canonical names only', () => {
    expect(getPattern('checkerboard')).toBeDefined();
    expect(getPattern('checker-32')).toBeUndefined();
  });
});
