import { describe, expect, it } from 'vitest';

import { resolveIconName } from '../icons/resolve-name';

describe('resolveIconName', () => {
  it('canonical → canonical (name exists in both sets, 24 requested)', () => {
    // `search` has both a 16 entry (`search`) and a 24 entry
    // (`interface-essential-search-1`) — a 24 request should go to the 24
    // preferred name.
    expect(resolveIconName('search', 24)).toEqual({
      resolvedName: 'interface-essential-search-1',
      resolvedSet: 24,
    });
  });

  it('canonical → canonical (16 requested) uses preferredSmallName', () => {
    expect(resolveIconName('search', 16)).toEqual({
      resolvedName: 'search',
      resolvedSet: 16,
    });
  });

  it('alias → canonical (alias resolves through manifest)', () => {
    // `settings` is an alias for `settings-cog`. At 24px it should pick the
    // 24px preferred name of the canonical entry.
    expect(resolveIconName('settings', 24)).toEqual({
      resolvedName: 'interface-essential-setting-cog',
      resolvedSet: 24,
    });

    expect(resolveIconName('settings', 16)).toEqual({
      resolvedName: 'settings-cog',
      resolvedSet: 16,
    });
  });

  it('name missing from manifest passes through at 16px (no upgrade/downgrade)', () => {
    expect(resolveIconName('this-icon-does-not-exist', 24)).toEqual({
      resolvedName: 'this-icon-does-not-exist',
      resolvedSet: 16,
    });

    expect(resolveIconName('this-icon-does-not-exist', 16)).toEqual({
      resolvedName: 'this-icon-does-not-exist',
      resolvedSet: 16,
    });
  });

  it('preferred-name mismatch: 24px name differs from 16px name', () => {
    // The 24px name `interface-essential-search-1` looks up the same entry
    // as `search`, and round-trips back to the 16px preferred name when 16
    // is requested.
    expect(resolveIconName('interface-essential-search-1', 16)).toEqual({
      resolvedName: 'search',
      resolvedSet: 16,
    });

    expect(resolveIconName('interface-essential-search-1', 24)).toEqual({
      resolvedName: 'interface-essential-search-1',
      resolvedSet: 24,
    });
  });

  it('24-only icon keeps size 24 when 24 is requested', () => {
    // `interface-essential-eraser` only exists in the 24 set.
    expect(resolveIconName('interface-essential-eraser', 24)).toEqual({
      resolvedName: 'interface-essential-eraser',
      resolvedSet: 24,
    });
  });

  it('24-only icon falls forward to the available 24px asset when 16 is requested', () => {
    // `interface-essential-eraser` has no preferredSmallName, but it does have
    // a 24px importer. Keep the request renderable instead of returning a
    // missing 16px name/set pair.
    expect(resolveIconName('interface-essential-eraser', 16)).toEqual({
      resolvedName: 'interface-essential-eraser',
      resolvedSet: 24,
    });
  });
});
