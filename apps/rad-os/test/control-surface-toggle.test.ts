import { create } from 'zustand';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWindowsSlice, type WindowsSlice } from '@/store/slices/windowsSlice';

vi.mock('@/lib/apps', async () => {
  const actual = await vi.importActual<typeof import('@/lib/apps')>('@/lib/apps');
  return {
    ...actual,
    supportsAmbientWidget: () => false,
    getWindowChrome: actual.getWindowChrome,
  };
});

const createStore = () => create<WindowsSlice>()((set, get, api) => createWindowsSlice(set, get, api));

describe('control surface toggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    document.documentElement.style.fontSize = '16px';
  });

  it('flips controlSurfaceOpen from the default (open) to closed on first toggle', () => {
    const store = createStore();
    store.getState().openWindow('brand');

    // Default is undefined (treated as open by the UI layer)
    expect(store.getState().getWindow('brand')?.controlSurfaceOpen).toBeUndefined();

    store.getState().toggleControlSurface('brand');
    expect(store.getState().getWindow('brand')?.controlSurfaceOpen).toEqual({
      right: false,
    });
  });

  it('flips back to open when toggled a second time', () => {
    const store = createStore();
    store.getState().openWindow('brand');

    store.getState().toggleControlSurface('brand');
    store.getState().toggleControlSurface('brand');

    expect(store.getState().getWindow('brand')?.controlSurfaceOpen).toEqual({
      right: true,
    });
  });

  it('setControlSurfaceOpen forces an explicit value', () => {
    const store = createStore();
    store.getState().openWindow('brand');

    store.getState().setControlSurfaceOpen('brand', false);
    expect(store.getState().getWindow('brand')?.controlSurfaceOpen).toEqual({
      right: false,
    });

    store.getState().setControlSurfaceOpen('brand', true);
    expect(store.getState().getWindow('brand')?.controlSurfaceOpen).toEqual({
      right: true,
    });
  });

  it('side-specific toggle flips only that side', () => {
    const store = createStore();
    store.getState().openWindow('pixel-playground');

    store.getState().toggleControlSurface('pixel-playground', 'left');
    expect(store.getState().getWindow('pixel-playground')?.controlSurfaceOpen).toEqual({
      left: false,
    });

    store.getState().toggleControlSurface('pixel-playground', 'right');
    expect(store.getState().getWindow('pixel-playground')?.controlSurfaceOpen).toEqual({
      left: false,
      right: false,
    });

    // Toggling with no side now flips both registered sides to the same state.
    store.getState().toggleControlSurface('pixel-playground');
    expect(store.getState().getWindow('pixel-playground')?.controlSurfaceOpen).toEqual({
      left: true,
      right: true,
    });
  });

  it('setControlSurfaceOpen with side only mutates that side', () => {
    const store = createStore();
    store.getState().openWindow('pixel-playground');

    store.getState().setControlSurfaceOpen('pixel-playground', false, 'left');
    store.getState().setControlSurfaceOpen('pixel-playground', true, 'right');

    expect(store.getState().getWindow('pixel-playground')?.controlSurfaceOpen).toEqual({
      left: false,
      right: true,
    });
  });

  it('is a no-op when the window does not exist', () => {
    const store = createStore();
    store.getState().toggleControlSurface('nonexistent');
    expect(store.getState().windows).toHaveLength(0);
  });
});
