import { describe, expect, it } from 'vitest';
import {
  bitmapIconEntryToPixelGrid,
  buildPixelPlaygroundIconRegistry,
  buildIconInventory,
  getIconCategory,
  summarizeIconReviewEntries,
} from '@/lib/icon-inventory';
import { bitmapIconSource16, bitmapIconSource24 } from '@rdna/pixel/icons';

describe('icon inventory', () => {
  it('builds a typed inventory from generated 16px and 24px bitmap sources', () => {
    const inventory = buildIconInventory();

    expect(inventory.icons16).toHaveLength(bitmapIconSource16.length);
    expect(inventory.icons24).toHaveLength(bitmapIconSource24.length);
    expect(inventory.icons).toHaveLength(bitmapIconSource16.length + bitmapIconSource24.length);
    expect(inventory.byKey.get('16:search')?.name).toBe('search');
    expect(inventory.byKey.get('24:interface-essential-search-1')?.name).toBe(
      'interface-essential-search-1',
    );
  });

  it('tracks current 24px to 16px mapping coverage and unused 16px icons', () => {
    const inventory = buildIconInventory();

    expect(inventory.byKey.get('24:interface-essential-search-1')).toMatchObject({
      size: 24,
      mappedTo16: 'search',
      mappingState: 'mapped',
    });
    expect(inventory.byKey.get('16:search')?.mappedFrom24).toContain(
      'interface-essential-search-1',
    );

    expect(inventory.coverage.mapped24).toBeGreaterThan(0);
    expect(inventory.coverage.unmapped24).toBeGreaterThan(0);
    expect(inventory.coverage.unused16).toBeGreaterThan(0);
    expect(inventory.unmapped24.map((icon) => icon.name)).toContain(
      'interface-essential-eraser',
    );
  });

  it('assigns stable categories and category progress for 24px mapper work', () => {
    const inventory = buildIconInventory();

    expect(getIconCategory('interface-essential-search-1')).toBe('interface');
    expect(getIconCategory('computers-devices-electronics-desktop')).toBe('devices');

    const iface = inventory.categories.find((category) => category.name === 'interface');
    expect(iface).toMatchObject({
      name: 'interface',
    });
    expect(iface?.total24).toBeGreaterThan(0);
    expect(iface?.mapped24).toBeGreaterThan(0);
  });

  it('summarizes conversion review entries without depending on the server loader', () => {
    const summary = summarizeIconReviewEntries(
      [
        { key: '16:search', name: 'search', iconSet: 16, acceptedIssue: null },
        {
          key: '24:interface-essential-search-1',
          name: 'interface-essential-search-1',
          iconSet: 24,
          acceptedIssue: { action: 'incorrect', signature: 'accepted' },
        },
        { key: '24:interface-essential-eraser', name: 'interface-essential-eraser', iconSet: 24 },
      ],
      {
        '16:search': 'incorrect',
      },
    );

    expect(summary).toEqual({
      total: 3,
      count16: 1,
      count24: 2,
      accepted: 1,
      delete: 0,
      incorrect: 1,
      implicitOk: 1,
    });
  });

  it('converts bitmap entries and preserves the playground registry semantics', () => {
    const closeEntry = bitmapIconSource16.find((entry) => entry.name === 'close');
    const handPointEntry = bitmapIconSource24.find((entry) => entry.name === 'hand-point');

    expect(closeEntry).toBeDefined();
    expect(handPointEntry).toBeDefined();

    const close = bitmapIconEntryToPixelGrid(closeEntry!);
    const handPoint = bitmapIconEntryToPixelGrid(handPointEntry!);
    const registry = buildPixelPlaygroundIconRegistry();

    expect(close).toMatchObject({ name: 'close', width: 16, height: 16 });
    expect(close.bits).toHaveLength(16 * 16);
    expect(handPoint).toMatchObject({ name: 'hand-point', width: 24, height: 24 });
    expect(handPoint.bits).toHaveLength(24 * 24);
    expect(registry.find((icon) => icon.name === 'close')?.width).toBe(16);
    expect(registry.find((icon) => icon.name === 'hand-point')?.width).toBe(24);
  });
});
