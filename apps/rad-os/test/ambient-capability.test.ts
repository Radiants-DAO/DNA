import { describe, expect, it } from 'vitest';
import { getActiveAmbientApp, supportsAmbientWidget } from '@/lib/apps/catalog';

describe('ambient capability', () => {
  it('no current apps have ambient capability', () => {
    expect(supportsAmbientWidget('music')).toBe(false);
    expect(supportsAmbientWidget('brand')).toBe(false);
  });

  it('returns null when no ambient-capable widget is open', () => {
    const ambient = getActiveAmbientApp([
      { id: 'music', isOpen: true, isWidget: true },
      { id: 'brand', isOpen: true, isWidget: false },
    ]);
    expect(ambient).toBeNull();
  });

  it('ignores widget windows that do not have ambient capability', () => {
    const ambient = getActiveAmbientApp([
      { id: 'brand', isOpen: true, isWidget: true },
    ]);
    expect(ambient).toBeNull();
  });
});
