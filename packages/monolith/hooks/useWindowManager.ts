'use client';

import { create } from 'zustand';
import { useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface WindowState {
  id: string;
  isOpen: boolean;
  isFullscreen: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  /** Flag to track if window has been centered (to avoid re-centering on reopen) */
  hasCentered?: boolean;
}

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;
  openWindow: (id: string, defaultSize?: { width: number; height: number }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  getWindow: (id: string) => WindowState | undefined;
}

// ============================================================================
// Constants
// ============================================================================

const CASCADE_OFFSET = 30;
const TASKBAR_HEIGHT = 48;

// ============================================================================
// Helpers
// ============================================================================

function calculateCenteredPosition(
  openCount: number,
  estimatedSize?: { width: number; height: number }
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return {
      x: 50 + openCount * CASCADE_OFFSET,
      y: 50 + openCount * CASCADE_OFFSET,
    };
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

// ============================================================================
// Store
// ============================================================================

export const useMonolithStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 100,

  openWindow: (id, defaultSize) => {
    const { windows, nextZIndex } = get();
    const existingWindow = windows.find((w) => w.id === id);

    if (existingWindow) {
      if (!existingWindow.isOpen) {
        set({
          windows: windows.map((w) =>
            w.id === id ? { ...w, isOpen: true, zIndex: nextZIndex } : w
          ),
          nextZIndex: nextZIndex + 1,
        });
      } else {
        get().focusWindow(id);
      }
      return;
    }

    const openCount = windows.filter((w) => w.isOpen).length;
    const position = calculateCenteredPosition(openCount, defaultSize);

    const newWindow: WindowState = {
      id,
      isOpen: true,
      isFullscreen: false,
      zIndex: nextZIndex,
      position,
      hasCentered: true,
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
        w.id === id ? { ...w, isOpen: false, isFullscreen: false } : w
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

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },

  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, size } : w
      ),
    }));
  },

  getWindow: (id) => get().windows.find((w) => w.id === id),
}));

// ============================================================================
// Hook
// ============================================================================

export interface UseWindowManagerReturn {
  windows: WindowState[];
  openWindows: WindowState[];
  openWindow: (appId: string, defaultSize?: { width: number; height: number }) => void;
  closeWindow: (appId: string) => void;
  focusWindow: (appId: string) => void;
  toggleFullscreen: (appId: string) => void;
  toggleWindow: (appId: string, defaultSize?: { width: number; height: number }) => void;
  updateWindowPosition: (appId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (appId: string, size: { width: number; height: number }) => void;
  isWindowOpen: (appId: string) => boolean;
  isWindowFullscreen: (appId: string) => boolean;
  getWindowState: (appId: string) => WindowState | undefined;
}

export function useWindowManager(): UseWindowManagerReturn {
  const windows = useMonolithStore((state) => state.windows);
  const storeOpenWindow = useMonolithStore((state) => state.openWindow);
  const storeCloseWindow = useMonolithStore((state) => state.closeWindow);
  const storeFocusWindow = useMonolithStore((state) => state.focusWindow);
  const storeToggleFullscreen = useMonolithStore((state) => state.toggleFullscreen);
  const storeUpdatePosition = useMonolithStore((state) => state.updateWindowPosition);
  const storeUpdateSize = useMonolithStore((state) => state.updateWindowSize);
  const storeGetWindow = useMonolithStore((state) => state.getWindow);

  const openWindows = useMemo(() => windows.filter((w) => w.isOpen), [windows]);

  const openWindow = useCallback(
    (appId: string, defaultSize?: { width: number; height: number }) => {
      storeOpenWindow(appId, defaultSize);
    },
    [storeOpenWindow]
  );

  const closeWindow = useCallback(
    (appId: string) => {
      storeCloseWindow(appId);
    },
    [storeCloseWindow]
  );

  const focusWindow = useCallback(
    (appId: string) => {
      storeFocusWindow(appId);
    },
    [storeFocusWindow]
  );

  const toggleFullscreen = useCallback(
    (appId: string) => {
      storeToggleFullscreen(appId);
    },
    [storeToggleFullscreen]
  );

  const toggleWindow = useCallback(
    (appId: string, defaultSize?: { width: number; height: number }) => {
      const window = storeGetWindow(appId);
      if (!window || !window.isOpen) {
        storeOpenWindow(appId, defaultSize);
      } else {
        storeCloseWindow(appId);
      }
    },
    [storeGetWindow, storeOpenWindow, storeCloseWindow]
  );

  const updateWindowPosition = useCallback(
    (appId: string, position: { x: number; y: number }) => {
      storeUpdatePosition(appId, position);
    },
    [storeUpdatePosition]
  );

  const updateWindowSize = useCallback(
    (appId: string, size: { width: number; height: number }) => {
      storeUpdateSize(appId, size);
    },
    [storeUpdateSize]
  );

  const isWindowOpen = useCallback(
    (appId: string): boolean => {
      const window = storeGetWindow(appId);
      return window?.isOpen ?? false;
    },
    [storeGetWindow]
  );

  const isWindowFullscreen = useCallback(
    (appId: string): boolean => {
      const window = storeGetWindow(appId);
      return window?.isFullscreen ?? false;
    },
    [storeGetWindow]
  );

  const getWindowState = useCallback(
    (appId: string): WindowState | undefined => {
      return storeGetWindow(appId);
    },
    [storeGetWindow]
  );

  return {
    windows,
    openWindows,
    openWindow,
    closeWindow,
    focusWindow,
    toggleFullscreen,
    toggleWindow,
    updateWindowPosition,
    updateWindowSize,
    isWindowOpen,
    isWindowFullscreen,
    getWindowState,
  };
}

export default useWindowManager;
