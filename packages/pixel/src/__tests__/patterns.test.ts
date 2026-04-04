import { describe, expect, it } from 'vitest';

import { getPattern, PATTERN_REGISTRY } from '../patterns';

describe('PATTERN_REGISTRY', () => {
  it('contains 51 patterns', () => {
    expect(PATTERN_REGISTRY).toHaveLength(51);
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

  it('solid pattern is all 1s', () => {
    expect(getPattern('solid')?.bits).toBe('1'.repeat(64));
  });

  it('empty pattern is all 0s', () => {
    expect(getPattern('empty')?.bits).toBe('0'.repeat(64));
  });

  it('checkerboard alternates correctly', () => {
    const checkerboard = getPattern('checkerboard');
    expect(checkerboard).toBeDefined();
    expect(checkerboard?.bits.slice(0, 8)).toBe('10101010');
    expect(checkerboard?.bits.slice(8, 16)).toBe('01010101');
  });
});
