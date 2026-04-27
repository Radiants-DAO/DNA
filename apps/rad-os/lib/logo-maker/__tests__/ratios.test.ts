import { describe, it, expect } from 'vitest';
import { RATIO_PRESETS, getRatioPreset, type RatioPresetId } from '../ratios';

describe('RATIO_PRESETS', () => {
  it('exposes the v1 preset list in order', () => {
    expect(RATIO_PRESETS.map((p) => p.id)).toEqual([
      'square-512',
      'wide-1080p',
      'og-1200x630',
      'favicon-128',
      'story-9-16',
    ]);
  });

  it('every preset has positive integer dimensions', () => {
    for (const p of RATIO_PRESETS) {
      expect(Number.isInteger(p.width)).toBe(true);
      expect(Number.isInteger(p.height)).toBe(true);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });

  it('getRatioPreset returns the matching preset', () => {
    expect(getRatioPreset('og-1200x630')?.width).toBe(1200);
    expect(getRatioPreset('og-1200x630')?.height).toBe(630);
  });

  it('getRatioPreset returns undefined for unknown ids', () => {
    expect(getRatioPreset('nope' as RatioPresetId)).toBeUndefined();
  });
});
