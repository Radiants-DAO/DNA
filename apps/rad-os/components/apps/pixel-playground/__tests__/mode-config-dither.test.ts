import { describe, expect, it } from 'vitest';

import { MODE_CONFIG, getRegistryForMode } from '../constants';

describe('dither mode config', () => {
  it('registers the dither mode with sensible defaults', () => {
    expect(MODE_CONFIG.dither).toBeDefined();
    expect(MODE_CONFIG.dither.mode).toBe('dither');
    expect(MODE_CONFIG.dither.label).toBe('Dither');
    expect(MODE_CONFIG.dither.defaultSize).toBeGreaterThan(0);
  });

  it('returns an empty registry for dither mode', () => {
    expect(getRegistryForMode('dither')).toEqual([]);
  });
});

describe('corners mode registry', () => {
  it('uses runtime-generated shape entries at the requested size', () => {
    const corners = getRegistryForMode('corners', 12);

    expect(corners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'circle-12', width: 12, height: 12 }),
        expect.objectContaining({ name: 'chamfer-12', width: 12, height: 12 }),
        expect.objectContaining({ name: 'scallop-12', width: 12, height: 12 }),
      ]),
    );
    expect(corners).toHaveLength(3);
  });
});
