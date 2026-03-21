'use client';

import { useCallback, useMemo } from 'react';
import { useRadOSStore, WindowState } from '@/store';

// Re-export WindowState for consumers
export type { WindowState } from '@/store';

export interface UseWindowManagerReturn {
  // State
  windows: WindowState[];
  openWindows: WindowState[];

  // Actions
  openWindow: (appId: string) => void;
  closeWindow: (appId: string) => void;
  focusWindow: (appId: string) => void;
  toggleFullscreen: (appId: string) => void;
  toggleWidget: (appId: string) => void;
  toggleWindow: (appId: string) => void;
  updateWindowPosition: (appId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (appId: string, size: { width: number; height: number }) => void;
  setActiveTab: (appId: string, tabId: string) => void;

  // Queries
  isWindowOpen: (appId: string) => boolean;
  isWindowFullscreen: (appId: string) => boolean;
  isWindowWidget: (appId: string) => boolean;
  getWindowState: (appId: string) => WindowState | undefined;
  getActiveTab: (appId: string) => string | undefined;
  getTopWindow: () => WindowState | undefined;
}

/**
 * Hook for managing window state in a desktop-like interface.
 * Uses Zustand store for global state management.
 *
 * Provides:
 * - Window open/close state
 * - Position tracking
 * - Size tracking
 * - Z-index management for focus
 * - Fullscreen toggle functionality
 *
 * @example
 * const { openWindow, closeWindow, focusWindow, toggleFullscreen } = useWindowManager();
 *
 * // Open a window (size resolved from catalog)
 * openWindow('brand');
 *
 * // Focus a window
 * focusWindow('brand');
 *
 * // Toggle fullscreen
 * toggleFullscreen('brand');
 *
 * // Close a window
 * closeWindow('brand');
 */
export function useWindowManager(): UseWindowManagerReturn {
  // Select state and actions from Zustand store
  const windows = useRadOSStore((state) => state.windows);
  const storeOpenWindow = useRadOSStore((state) => state.openWindow);
  const storeCloseWindow = useRadOSStore((state) => state.closeWindow);
  const storeFocusWindow = useRadOSStore((state) => state.focusWindow);
  const storeToggleFullscreen = useRadOSStore((state) => state.toggleFullscreen);
  const storeToggleWidget = useRadOSStore((state) => state.toggleWidget);
  const storeUpdatePosition = useRadOSStore((state) => state.updateWindowPosition);
  const storeUpdateSize = useRadOSStore((state) => state.updateWindowSize);
  const storeSetActiveTab = useRadOSStore((state) => state.setActiveTab);
  const storeGetWindow = useRadOSStore((state) => state.getWindow);

  // Computed: open windows
  const openWindows = useMemo(
    () => windows.filter((w) => w.isOpen),
    [windows]
  );

  // Actions with stable references
  const openWindow = useCallback(
    (appId: string) => {
      storeOpenWindow(appId);
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

  const toggleWidget = useCallback(
    (appId: string) => {
      storeToggleWidget(appId);
    },
    [storeToggleWidget]
  );

  const toggleWindow = useCallback(
    (appId: string) => {
      const window = storeGetWindow(appId);
      if (!window || !window.isOpen) {
        storeOpenWindow(appId);
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

  const setActiveTab = useCallback(
    (appId: string, tabId: string) => {
      storeSetActiveTab(appId, tabId);
    },
    [storeSetActiveTab]
  );

  // Queries
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

  const isWindowWidget = useCallback(
    (appId: string): boolean => {
      const window = storeGetWindow(appId);
      return window?.isWidget ?? false;
    },
    [storeGetWindow]
  );

  const getWindowState = useCallback(
    (appId: string): WindowState | undefined => {
      return storeGetWindow(appId);
    },
    [storeGetWindow]
  );

  const getActiveTab = useCallback(
    (appId: string): string | undefined => {
      return storeGetWindow(appId)?.activeTab;
    },
    [storeGetWindow]
  );

  const getTopWindow = useCallback((): WindowState | undefined => {
    const visibleWindows = windows.filter((w) => w.isOpen);
    if (visibleWindows.length === 0) return undefined;
    return visibleWindows.reduce((top, current) =>
      current.zIndex > top.zIndex ? current : top
    );
  }, [windows]);

  return {
    windows,
    openWindows,
    openWindow,
    closeWindow,
    focusWindow,
    toggleFullscreen,
    toggleWidget,
    toggleWindow,
    updateWindowPosition,
    updateWindowSize,
    setActiveTab,
    isWindowOpen,
    isWindowFullscreen,
    isWindowWidget,
    getWindowState,
    getActiveTab,
    getTopWindow,
  };
}

export default useWindowManager;
