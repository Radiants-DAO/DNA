import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { patternRegistry } from '../patterns/registry';
import { renderPatternCss } from '../scripts/generate-pattern-css';

const root = resolve(process.cwd());
const patternsCssPath = resolve(root, 'patterns.css');

describe('pattern registry', () => {
  it('stores bitstrings as the source of truth', () => {
    expect(patternRegistry.length).toBeGreaterThan(0);
    expect(patternRegistry[0]).toHaveProperty('bits');
    expect(patternRegistry.every((entry) => entry.bits.length === 64)).toBe(true);
    expect(patternRegistry.every((entry) => !('hex' in entry))).toBe(true);
  });
});

describe('generate-pattern-css', () => {
  it('reproduces the checked-in patterns.css from registry bitstrings', () => {
    const expected = readFileSync(patternsCssPath, 'utf8');
    expect(renderPatternCss()).toBe(expected);
  });

  it('keeps the public token and utility surface intact', () => {
    const css = renderPatternCss();
    expect(css).toContain('--pat-checkerboard:');
    expect(css).toContain('--pat-fill-97:');
    expect(css).toContain('.rdna-pat');
    expect(css).toContain('.rdna-pat--checkerboard');
    expect(css).toContain('.rdna-pat--2x');
    expect(css).toContain('--pat-mask-size');
    expect(css).toContain('var(--pixel-scale, 1)');
    expect(css).toContain('background: var(--pat-fill, var(--pat-color, var(--color-main)))');
    expect(css).toContain('mask-image');
    expect(css).toContain('mask-repeat');
    expect(css).toContain('.rdna-pat > *');
    expect(css).toContain('z-index: 1;');
  });
});
