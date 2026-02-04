import { describe, it, expect } from 'vitest';
import {
  applyColor,
  toOklch,
  fromOklch,
  toOklchString,
  shiftHue,
  adjustLightness,
  adjustChroma,
  mixColors,
  isInGamut,
  clampToGamut,
} from '../features/colors';
import { applyShadow } from '../features/shadows';

describe('colors feature', () => {
  it('sets background-color and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyColor(el, { backgroundColor: 'rgb(0,0,0)' });
    expect(diff.changes[0].property).toBe('background-color');
  });

  it('sets color and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyColor(el, { color: '#ff0000' });
    expect(diff.changes[0].property).toBe('color');
    expect(el.style.color).toBe('rgb(255, 0, 0)');
  });
});

describe('OKLCH color utilities', () => {
  it('converts hex to OKLCH components', () => {
    const oklch = toOklch('#ff0000');
    expect(oklch.l).toBeGreaterThan(0.5);
    expect(oklch.c).toBeGreaterThan(0.2);
    expect(oklch.h).toBeCloseTo(29, 0); // Red is around 29° in OKLCH
  });

  it('creates OKLCH string from components', () => {
    const result = fromOklch(0.7, 0.15, 180);
    expect(result).toContain('oklch');
  });

  it('converts any color to OKLCH string', () => {
    const result = toOklchString('rgb(0, 128, 255)');
    expect(result).toContain('oklch');
  });

  it('shifts hue in OKLCH space', () => {
    const original = toOklch('#ff0000');
    const shifted = shiftHue('#ff0000', 120);
    const shiftedOklch = toOklch(shifted);

    // Hue should be shifted by ~120 degrees
    const hueDiff = Math.abs(shiftedOklch.h - original.h);
    expect(hueDiff).toBeCloseTo(120, 0);
  });

  it('adjusts lightness in OKLCH space', () => {
    const lighter = adjustLightness('#808080', 0.2);
    const lighterOklch = toOklch(lighter);
    const originalOklch = toOklch('#808080');

    expect(lighterOklch.l).toBeGreaterThan(originalOklch.l);
  });

  it('adjusts chroma in OKLCH space', () => {
    const original = toOklch('#ff6666');
    const desaturated = adjustChroma('#ff6666', -0.05);
    const desaturatedOklch = toOklch(desaturated);

    // Chroma should decrease
    expect(Number(desaturatedOklch.c)).toBeLessThan(Number(original.c));
  });

  it('mixes two colors in OKLCH space', () => {
    const mixed = mixColors('#ff0000', '#0000ff', 0.5);
    expect(mixed).toContain('oklch');
  });

  it('checks if color is in sRGB gamut', () => {
    expect(isInGamut('#ff0000')).toBe(true);
    // Very saturated OKLCH colors may be out of gamut
    expect(isInGamut('oklch(0.9 0.4 150)')).toBe(false);
  });

  it('clamps out-of-gamut colors', () => {
    const outOfGamut = 'oklch(0.9 0.4 150)';
    const clamped = clampToGamut(outOfGamut);
    expect(isInGamut(clamped)).toBe(true);
  });
});

describe('shadows feature', () => {
  it('sets box-shadow and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyShadow(el, { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' });
    expect(diff.changes[0].property).toBe('box-shadow');
  });
});
