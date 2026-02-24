import { StateCreator } from 'zustand';

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  isWidget: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface WindowsSlice {
  // State
  windows: WindowState[];
  nextZIndex: number;

  // Actions
  openWindow: (id: string, defaultSize?: { width: number; height: number }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  toggleWidget: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
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

  openWindow: (id, defaultSize) => {
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

    // Calculate centered position (with cascade offset for multiple windows)
    const openCount = windows.filter((w) => w.isOpen).length;
    const cascadePosition = calculateCenteredPosition(openCount, defaultSize);

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
      ...(defaultSize && { size: defaultSize }),
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
    const { windows } = get();
    set({
      windows: windows.map((w) =>
        w.id === id
          ? { ...w, isWidget: !w.isWidget, isFullscreen: false }
          : w
      ),
    });
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

  getWindow: (id) => {
    return get().windows.find((w) => w.id === id);
  },

  getOpenWindows: () => {
    return get().windows.filter((w) => w.isOpen);
  },
});
