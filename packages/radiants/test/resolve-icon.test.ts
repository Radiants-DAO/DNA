import { describe, expect, it } from 'vitest';

describe('resolveIconRequest', () => {
  it('reads prepared icon families from the unified manifest', async () => {
    const { getPreparedSvgIcon } = await import('../icons/manifest');

    expect(getPreparedSvgIcon('settings')).toMatchObject({
      name: 'settings-cog',
      availableSets: [16, 24],
      importerKeys: {
        16: '16px/settings-cog',
        24: '24px/interface-essential-setting-cog',
      },
      preferredSmallName: 'settings-cog',
      preferredLargeName: 'interface-essential-setting-cog',
    });

    expect(getPreparedSvgIcon('interface-essential-search-1')).toMatchObject({
      name: 'search',
      availableSets: [16, 24],
      importerKeys: {
        16: '16px/search',
        24: '24px/interface-essential-search-1',
      },
      preferredSmallName: 'search',
      preferredLargeName: 'interface-essential-search-1',
    });
  });

  it('maps aliases and size variants to the 24px icon set when a mapping exists', async () => {
    const { getIconImporter, resolveIconRequest } = await import(
      '../icons/resolve-icon'
    );

    expect(resolveIconRequest('search', 24)).toEqual({
      resolvedName: 'interface-essential-search-1',
      resolvedSet: 24,
      importerKey: '24px/interface-essential-search-1',
    });
    const importer = getIconImporter('interface-essential-search-1', 24);
    expect(importer).toBeTypeOf('function');
    const module = await importer?.();
    expect(typeof module?.default).toBe('function');
  });

  it('falls back to the 16px set when no 24px equivalent exists', async () => {
    const { getIconImporter, resolveIconRequest } = await import(
      '../icons/resolve-icon'
    );

    expect(resolveIconRequest('chevron-left', 24)).toEqual({
      resolvedName: 'chevron-left',
      resolvedSet: 16,
      importerKey: '16px/chevron-left',
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
      importerKey: '16px/search',
    });
  });

  it('resolves 24-only icons that have no size-map entry', async () => {
    const { getIconImporter, resolveIconRequest } = await import(
      '../icons/resolve-icon'
    );

    expect(resolveIconRequest('interface-essential-eraser', 24)).toEqual({
      resolvedName: 'interface-essential-eraser',
      resolvedSet: 24,
      importerKey: '24px/interface-essential-eraser',
    });
    const importer = getIconImporter('interface-essential-eraser', 24);
    expect(importer).toBeTypeOf('function');
    const module = await importer?.();
    expect(typeof module?.default).toBe('function');
  });

  it('falls forward to the 24px set for 24-only icons requested at 16px', async () => {
    const { resolveIconRequest } = await import('../icons/resolve-icon');

    expect(resolveIconRequest('interface-essential-eraser', 16)).toEqual({
      resolvedName: 'interface-essential-eraser',
      resolvedSet: 24,
      importerKey: '24px/interface-essential-eraser',
    });
  });
});
