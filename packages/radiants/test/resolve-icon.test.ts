import { describe, expect, it } from 'vitest';

describe('resolve-icon', () => {
  it('maps aliases and size variants to the 24px icon set when a mapping exists', async () => {
    const { getIconImporter, resolveIconRequest } = await import('../icons/resolve-icon');

    expect(resolveIconRequest('search', 24)).toEqual({
      resolvedName: 'interface-essential-search-1',
      resolvedSet: 24,
    });
    const importer = getIconImporter('interface-essential-search-1', 24);
    expect(importer).toBeTypeOf('function');
    const module = await importer?.();
    expect(typeof module?.default).toBe('function');
  });

  it('falls back to the 16px set when no 24px equivalent exists', async () => {
    const { getIconImporter, resolveIconRequest } = await import('../icons/resolve-icon');

    expect(resolveIconRequest('chevron-left', 24)).toEqual({
      resolvedName: 'chevron-left',
      resolvedSet: 16,
    });
    const importer = getIconImporter('chevron-left', 16);
    expect(importer).toBeTypeOf('function');
    const module = await importer?.();
    expect(typeof module?.default).toBe('function');
  });

  it('maps 24px names back to their 16px equivalents', async () => {
    const { resolveIconRequest } = await import('../icons/resolve-icon');

    expect(resolveIconRequest('interface-essential-search-1', 16)).toEqual({
      resolvedName: 'search',
      resolvedSet: 16,
    });
  });
});
