import { StateCreator } from 'zustand';
import { getWindowChrome, supportsAmbientWidget } from '@/lib/apps';
import { resolveWindowSize, remToPx } from '@/lib/windowSizing';

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  isWidget: boolean;
  zIndex: number;
  position: { x: number; y: number };
  /** Runtime size in px (set by resize dragging) */
  size?: { width: number; height: number };
  /** Active tab within the window (if the app uses tabs) */
  activeTab?: string;
}

export interface WindowsSlice {
  // State
  windows: WindowState[];
  nextZIndex: number;

  // Actions
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
const TASKBAR_HEIGHT = 48; // bottom-12 = 48px

/**
 * Calculate centered position for a new window.
 * Centers in the visible desktop area (accounting for taskbar).
 * Falls back to cascade positioning if viewport is not available.
 */
function calculateCenteredPosition(
  openCount: number,
  estimatedSize?: { width: number; height: number }
): { x: number; y: number } {
  // SSR safety check
  if (typeof window === 'undefined') {
    return {
      x: 50 + openCount * CASCADE_OFFSET,
      y: 50 + openCount * CASCADE_OFFSET,
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const desktopHeight = viewportHeight - TASKBAR_HEIGHT;

  // Default window size estimate if not provided
  const windowWidth = estimatedSize?.width ?? 600;
  const windowHeight = estimatedSize?.height ?? 400;

  // Calculate centered position
  let x = Math.max(0, (viewportWidth - windowWidth) / 2);
  let y = Math.max(0, (desktopHeight - windowHeight) / 2);

  // Apply cascade offset if multiple windows are open
  if (openCount > 0) {
    x += openCount * CASCADE_OFFSET;
    y += openCount * CASCADE_OFFSET;
  }

  // Ensure window doesn't go off-screen
  x = Math.min(x, viewportWidth - Math.min(windowWidth, 300));
  y = Math.min(y, desktopHeight - Math.min(windowHeight, 200));

  return { x: Math.round(x), y: Math.round(y) };
}

export const createWindowsSlice: StateCreator<WindowsSlice, [], [], WindowsSlice> = (
  set,
  get
) => ({
  windows: [],
  nextZIndex: 1,

  openWindow: (id) => {
    const { windows, nextZIndex } = get();
    const existingWindow = windows.find((w) => w.id === id);

    if (existingWindow) {
      // If window exists but is closed, restore it
      if (!existingWindow.isOpen) {
        set({
          windows: windows.map((w) =>
            w.id === id
              ? { ...w, isOpen: true, zIndex: nextZIndex }
              : w
          ),
          nextZIndex: nextZIndex + 1,
        });
      } else {
        // Just focus it
        get().focusWindow(id);
      }
      return;
    }

    // Resolve size from catalog defaults
    const defaults = getWindowChrome(id);
    const cssSize = defaults?.defaultSize ? resolveWindowSize(defaults.defaultSize) : undefined;
    const pxEstimate = cssSize
      ? { width: remToPx(cssSize.width), height: remToPx(cssSize.height) }
      : undefined;

    // Calculate centered position (with cascade offset for multiple windows)
    const openCount = windows.filter((w) => w.isOpen).length;
    const cascadePosition = calculateCenteredPosition(openCount, pxEstimate);

    // Warn if more than 5 windows (soft limit)
    if (openCount >= 5) {
      console.warn('RadOS: More than 5 windows open may affect performance');
    }

    const newWindow: WindowState = {
      id,
      isOpen: true,
      isFullscreen: false,
      isWidget: false,
      zIndex: nextZIndex,
      position: cascadePosition,
    };

    set({
      windows: [...windows, newWindow],
      nextZIndex: nextZIndex + 1,
    });
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: false, isFullscreen: false, isWidget: false } : w
      ),
    }));
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get();
    const window = windows.find((w) => w.id === id);

    if (window && window.isOpen) {
      set({
        windows: windows.map((w) =>
          w.id === id ? { ...w, zIndex: nextZIndex } : w
        ),
        nextZIndex: nextZIndex + 1,
      });
    }
  },

  toggleFullscreen: (id) => {
    const { windows, nextZIndex } = get();
    set({
      windows: windows.map((w) =>
        w.id === id
          ? { ...w, isFullscreen: !w.isFullscreen, zIndex: nextZIndex }
          : w
      ),
      nextZIndex: nextZIndex + 1,
    });
  },

  toggleWidget: (id) => {
    if (!supportsAmbientWidget(id)) return;
    const targetIsWidget = !get().getWindow(id)?.isWidget;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, isWidget: targetIsWidget, isFullscreen: false }
          : targetIsWidget
            ? { ...w, isWidget: false }
            : w
      ),
    }));
  },

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },

  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    }));
  },

  setActiveTab: (id, tabId) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, activeTab: tabId } : w
      ),
    }));
  },

  getWindow: (id) => {
    return get().windows.find((w) => w.id === id);
  },

  getOpenWindows: () => {
    return get().windows.filter((w) => w.isOpen);
  },
});
