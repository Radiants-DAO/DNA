import { StateCreator } from 'zustand';
import { getWindowChrome } from '../../lib/catalog';
import { resolveWindowSize, remToPx } from '../../lib/windowSizing';

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  isWidget: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  activeTab?: string;
}

export interface WindowsSlice {
  windows: WindowState[];
  nextZIndex: number;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  toggleWidget: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  setActiveTab: (id: string, tabId: string) => void;
  getWindow: (id: string) => WindowState | undefined;
  getOpenWindows: () => WindowState[];
}

const CASCADE_OFFSET = 30;
const TASKBAR_HEIGHT = 48;

function calculateCenteredPosition(
  openCount: number,
  estimatedSize?: { width: number; height: number },
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 50 + openCount * CASCADE_OFFSET, y: 50 + openCount * CASCADE_OFFSET };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const desktopHeight = viewportHeight - TASKBAR_HEIGHT;
  const windowWidth = estimatedSize?.width ?? 600;
  const windowHeight = estimatedSize?.height ?? 400;

  let x = Math.max(0, (viewportWidth - windowWidth) / 2);
  let y = Math.max(0, (desktopHeight - windowHeight) / 2);

  if (openCount > 0) {
    x += openCount * CASCADE_OFFSET;
    y += openCount * CASCADE_OFFSET;
  }

  x = Math.min(x, viewportWidth - Math.min(windowWidth, 300));
  y = Math.min(y, desktopHeight - Math.min(windowHeight, 200));

  return { x: Math.round(x), y: Math.round(y) };
}

export const createWindowsSlice: StateCreator<WindowsSlice, [], [], WindowsSlice> = (
  set,
  get,
) => ({
  windows: [],
  nextZIndex: 1,

  openWindow: (id) => {
    const { windows, nextZIndex } = get();
    const existingWindow = windows.find((w) => w.id === id);

    if (existingWindow) {
      if (!existingWindow.isOpen) {
        set({
          windows: windows.map((w) =>
            w.id === id ? { ...w, isOpen: true, zIndex: nextZIndex } : w,
          ),
          nextZIndex: nextZIndex + 1,
        });
      } else {
        get().focusWindow(id);
      }
      return;
    }

    const defaults = getWindowChrome(id);
    const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
    const pxEstimate = cssSize
      ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
      : undefined;

    const openCount = windows.filter((w) => w.isOpen).length;

    set({
      windows: [
        ...windows,
        {
          id,
          isOpen: true,
          isFullscreen: false,
          isWidget: false,
          zIndex: nextZIndex,
          position: calculateCenteredPosition(openCount, pxEstimate),
        },
      ],
      nextZIndex: nextZIndex + 1,
    });
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: false, isFullscreen: false, isWidget: false } : w,
      ),
    }));
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get();
    const win = windows.find((w) => w.id === id);
    if (win && win.isOpen) {
      set({
        windows: windows.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex } : w)),
        nextZIndex: nextZIndex + 1,
      });
    }
  },

  toggleFullscreen: (id) => {
    const { windows, nextZIndex } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, isFullscreen: !w.isFullscreen, zIndex: nextZIndex } : w,
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  toggleWidget: (_id) => {
    // No-op in prototype — ambient widget support not included
  },

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, position } : w)),
    }));
  },

  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    }));
  },

  setActiveTab: (id, tabId) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, activeTab: tabId } : w)),
    }));
  },

  getWindow: (id) => get().windows.find((w) => w.id === id),

  getOpenWindows: () => get().windows.filter((w) => w.isOpen),
});
