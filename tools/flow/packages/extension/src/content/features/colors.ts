import Color from 'colorjs.io';
import { recordStyleMutation } from '../mutations/mutationRecorder';
import { normalizeStyleChanges } from './styleUtils';

/**
 * Apply color changes to an element and record the diff.
 */
export function applyColor(el: HTMLElement, changes: Record<string, string>) {
  const before: Record<string, string> = {};
  const normalized = normalizeStyleChanges(changes);

  Object.keys(normalized).forEach((prop) => {
    before[prop] = el.style.getPropertyValue(prop);
    el.style.setProperty(prop, normalized[prop]);
  });

  return recordStyleMutation(el.dataset.flowRef ?? 'unknown', before, normalized);
}

/**
 * Parse any color string to OKLCH components.
 */
export function toOklch(color: string): { l: number; c: number; h: number } {
  const c = new Color(color);
  const oklch = c.to('oklch');
  return {
    l: oklch.get('l'),
    c: oklch.get('c'),
    h: oklch.get('h') || 0, // h can be NaN for achromatic colors
  };
}

/**
 * Create a CSS oklch() string from components.
 */
export function fromOklch(l: number, c: number, h: number): string {
  const color = new Color('oklch', [l, c, h]);
  return color.to('oklch').toString({ format: 'oklch' });
}

/**
 * Convert any color to CSS oklch() format.
 */
export function toOklchString(color: string): string {
  const c = new Color(color);
  return c.to('oklch').toString({ format: 'oklch' });
}

/**
 * Shift the hue of a color in OKLCH space.
 * @param color - Input color in any CSS format
 * @param degrees - Hue shift in degrees (positive = clockwise)
 */
export function shiftHue(color: string, degrees: number): string {
  const c = new Color(color).to('oklch');
  const currentHue = c.get('h') || 0;
  c.set('h', (currentHue + degrees) % 360);
  return c.toString({ format: 'oklch' });
}

/**
 * Adjust the lightness of a color in OKLCH space.
 * @param color - Input color in any CSS format
 * @param delta - Lightness adjustment (-1 to 1, where 1 is full white)
 */
export function adjustLightness(color: string, delta: number): string {
  const c = new Color(color).to('oklch');
  const currentL = c.get('l');
  c.set('l', Math.max(0, Math.min(1, currentL + delta)));
  return c.toString({ format: 'oklch' });
}

/**
 * Adjust the chroma (saturation) of a color in OKLCH space.
 * @param color - Input color in any CSS format
 * @param delta - Chroma adjustment (negative = less saturated)
 */
export function adjustChroma(color: string, delta: number): string {
  const c = new Color(color).to('oklch');
  const currentC = c.get('c');
  c.set('c', Math.max(0, currentC + delta));
  return c.toString({ format: 'oklch' });
}

/**
 * Set a specific OKLCH component of a color.
 */
export function setOklchComponent(
  color: string,
  component: 'l' | 'c' | 'h',
  value: number
): string {
  const c = new Color(color).to('oklch');
  c.set(component, value);
  return c.toString({ format: 'oklch' });
}

/**
 * Mix two colors in OKLCH space.
 * @param color1 - First color
 * @param color2 - Second color
 * @param ratio - Mix ratio (0 = all color1, 1 = all color2)
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const c1 = new Color(color1);
  const c2 = new Color(color2);
  const mixed = c1.mix(c2, ratio, { space: 'oklch' });
  return mixed.to('oklch').toString({ format: 'oklch' });
}

/**
 * Check if a color is within the sRGB gamut.
 */
export function isInGamut(color: string): boolean {
  const c = new Color(color);
  return c.inGamut('srgb');
}

/**
 * Clamp a color to the sRGB gamut if out of bounds.
 */
export function clampToGamut(color: string): string {
  const c = new Color(color);
  if (!c.inGamut('srgb')) {
    c.toGamut({ space: 'srgb', method: 'css' });
  }
  return c.to('oklch').toString({ format: 'oklch' });
}
