import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pixelIconSource } from '../pixel-icons/source';
import { renderPixelIconRegistry } from '../scripts/generate-pixel-icon-registry';

const root = resolve(process.cwd());
const registryPath = resolve(root, 'pixel-icons/registry.ts');

describe('pixel icon source', () => {
  it('stores icon bitstrings as the source of truth', () => {
    expect(pixelIconSource.length).toBeGreaterThan(0);
    expect(pixelIconSource.every((entry) => entry.bits.length === entry.width * entry.height)).toBe(true);
  });
});

describe('generate-pixel-icon-registry', () => {
  it('reproduces the checked-in registry from the source bitstrings', () => {
    const expected = readFileSync(registryPath, 'utf8');
    expect(renderPixelIconRegistry()).toBe(expected);
  });

  it('includes precomputed mask-image data for each icon entry', () => {
    const code = renderPixelIconRegistry();
    expect(code).toContain('maskImage:');
    expect(code).toContain('data:image/svg+xml');
    expect(code).toContain('name: "caret"');
  });
});
