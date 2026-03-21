import { describe, expect, it } from 'vitest';
import { getActiveAmbientApp, supportsAmbientWidget } from '@/lib/apps/catalog';

describe('ambient capability', () => {
  it('marks Rad Radio as ambient-capable', () => {
    expect(supportsAmbientWidget('music')).toBe(true);
    expect(supportsAmbientWidget('brand')).toBe(false);
  });

  it('returns the active ambient app only when a widget window is open', () => {
    const ambient = getActiveAmbientApp([
      { id: 'music', isOpen: true, isWidget: true },
      { id: 'brand', isOpen: true, isWidget: false },
    ]);
    expect(ambient?.app.id).toBe('music');
  });

  it('ignores widget windows that do not have ambient capability', () => {
    const ambient = getActiveAmbientApp([
      { id: 'brand', isOpen: true, isWidget: true },
    ]);
    expect(ambient).toBeNull();
  });
});
