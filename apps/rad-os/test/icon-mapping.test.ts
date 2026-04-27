import { describe, expect, it } from 'vitest';
import { buildIconInventory } from '@/lib/icon-inventory';
import {
  applyIconMappingSelection,
  filterIconMappingEntries,
  formatIconMappingPatch,
  getInitialIconMappingState,
  isIconMappingModeActive,
} from '@/components/apps/pixel-playground/icon-mapping';

describe('icon mapping workbench state', () => {
  it('uses the 21px and 16px switches as library filters', () => {
    const inventory = buildIconInventory();
    const state = getInitialIconMappingState();

    expect(filterIconMappingEntries(inventory.icons, state).some((icon) => icon.size === 24)).toBe(
      true,
    );
    expect(filterIconMappingEntries(inventory.icons, state).some((icon) => icon.size === 16)).toBe(
      true,
    );

    expect(
      filterIconMappingEntries(inventory.icons, { ...state, show16: false }).every(
        (icon) => icon.size === 24,
      ),
    ).toBe(true);
    expect(
      filterIconMappingEntries(inventory.icons, { ...state, show21: false }).every(
        (icon) => icon.size === 16,
      ),
    ).toBe(true);
  });

  it('only enters mapping mode when both size filters and map mode are enabled', () => {
    const state = getInitialIconMappingState();

    expect(isIconMappingModeActive({ ...state, mapMode: true })).toBe(true);
    expect(isIconMappingModeActive({ ...state, show21: false, mapMode: true })).toBe(false);
    expect(isIconMappingModeActive({ ...state, show16: false, mapMode: true })).toBe(false);
  });

  it('records 21px to 16px mappings from paired selections and formats output', () => {
    const inventory = buildIconInventory();
    const source = inventory.byKey.get('24:interface-essential-search-1');
    const target = inventory.byKey.get('16:search');

    expect(source).toBeDefined();
    expect(target).toBeDefined();

    let state = { ...getInitialIconMappingState(), mapMode: true };
    state = applyIconMappingSelection(state, source!);
    state = applyIconMappingSelection(state, target!);

    expect(state.source24Name).toBe('interface-essential-search-1');
    expect(state.target16Name).toBe('search');
    expect(state.mappings).toEqual([
      { source24Name: 'interface-essential-search-1', target16Name: 'search' },
    ]);
    expect(formatIconMappingPatch(state.mappings)).toContain(
      "'interface-essential-search-1': 'search'",
    );
  });
});
