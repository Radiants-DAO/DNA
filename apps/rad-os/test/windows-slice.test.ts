import { create } from 'zustand';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWindowsSlice, type WindowsSlice } from '@/store/slices/windowsSlice';

vi.mock('@/lib/apps', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apps')>('@/lib/apps');
  return {
    ...actual,
    supportsAmbientWidget: (id: string) => id === 'music' || id === 'music-2',
    getWindowChrome: (id: string) =>
      id === 'music-2'
        ? {
            windowTitle: 'Music 2',
            windowIcon: null,
            defaultSize: 'md',
            resizable: true,
            contentPadding: false,
            ambient: { widget: () => null },
          }
        : actual.getWindowChrome(id),
  };
});

const createStore = () => create<WindowsSlice>()((set, get, api) => createWindowsSlice(set, get, api));

describe('windows slice launch policy', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    document.documentElement.style.fontSize = '16px';
  });

  it('centers from catalog default size without caller-supplied defaults', () => {
    const store = createStore();
    store.getState().openWindow('music');
    const pos = store.getState().getWindow('music')?.position;
    // 'md' tier = 48rem × 36rem = 768×576 at 16px base
    const expectedX = (1440 - 768) / 2;
    const expectedY = (900 - 576) / 2;
    expect(pos!.x).toBeCloseTo(expectedX, -1);
    expect(pos!.y).toBeCloseTo(expectedY, -1);
  });

  it('ignores widget toggles for apps without ambient capability', () => {
    const store = createStore();
    store.getState().openWindow('brand');
    store.getState().toggleWidget('brand');
    expect(store.getState().getWindow('brand')?.isWidget).toBe(false);
  });

  it('keeps ambient widget mode singleton', () => {
    const store = createStore();
    store.getState().openWindow('music');
    store.getState().openWindow('music-2');
    store.getState().toggleWidget('music');
    store.getState().toggleWidget('music-2');
    expect(store.getState().getWindow('music')?.isWidget).toBe(false);
    expect(store.getState().getWindow('music-2')?.isWidget).toBe(true);
  });
});
