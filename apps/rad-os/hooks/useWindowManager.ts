'use client';

import { useCallback, useMemo } from 'react';
import { useRadOSStore, WindowState } from '@/store';
import type { ControlSurfaceSide, SnapRegion } from '@/store/slices/windowsSlice';

// Re-export WindowState for consumers
export type { WindowState } from '@/store';
export type { ControlSurfaceSide, SnapRegion } from '@/store/slices/windowsSlice';

export interface UseWindowManagerReturn {
  // State
  windows: WindowState[];
  openWindows: WindowState[];

  // Actions
  openWindow: (appId: string) => void;
  openWindowWithZoom: (appId: string, sourceRect: { x: number; y: number; width: number; height: number }) => void;
  closeWindow: (appId: string) => void;
  focusWindow: (appId: string) => void;
  toggleFullscreen: (appId: string) => void;
  toggleWidget: (appId: string) => void;
  toggleWindow: (appId: string) => void;
  centerWindow: (appId: string) => void;
  snapWindow: (appId: string, region: SnapRegion) => void;
  restoreWindowSize: (appId: string) => void;
  updateWindowPosition: (appId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (appId: string, size: { width: number; height: number }) => void;
  setActiveTab: (appId: string, tabId: string) => void;
  toggleControlSurface: (appId: string, side?: ControlSurfaceSide) => void;
  setControlSurfaceOpen: (appId: string, open: boolean, side?: ControlSurfaceSide) => void;

  // Queries
  isWindowOpen: (appId: string) => boolean;
  isWindowFullscreen: (appId: string) => boolean;
  isWindowWidget: (appId: string) => boolean;
  canRestoreWindow: (appId: string) => boolean;
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
  const storeOpenWindowWithZoom = useRadOSStore((state) => state.openWindowWithZoom);
  const storeCloseWindow = useRadOSStore((state) => state.closeWindow);
  const storeFocusWindow = useRadOSStore((state) => state.focusWindow);
  const storeToggleFullscreen = useRadOSStore((state) => state.toggleFullscreen);
  const storeToggleWidget = useRadOSStore((state) => state.toggleWidget);
  const storeCenterWindow = useRadOSStore((state) => state.centerWindow);
  const storeSnapWindow = useRadOSStore((state) => state.snapWindow);
  const storeRestoreWindowSize = useRadOSStore((state) => state.restoreWindowSize);
  const storeUpdatePosition = useRadOSStore((state) => state.updateWindowPosition);
  const storeUpdateSize = useRadOSStore((state) => state.updateWindowSize);
  const storeSetActiveTab = useRadOSStore((state) => state.setActiveTab);
  const storeToggleControlSurface = useRadOSStore((state) => state.toggleControlSurface);
  const storeSetControlSurfaceOpen = useRadOSStore((state) => state.setControlSurfaceOpen);

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

  const openWindowWithZoom = useCallback(
    (appId: string, sourceRect: { x: number; y: number; width: number; height: number }) => {
      storeOpenWindowWithZoom(appId, sourceRect);
    },
    [storeOpenWindowWithZoom]
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

  const centerWindow = useCallback(
    (appId: string) => {
      storeCenterWindow(appId);
    },
    [storeCenterWindow]
  );

  const snapWindow = useCallback(
    (appId: string, region: SnapRegion) => {
      storeSnapWindow(appId, region);
    },
    [storeSnapWindow]
  );

  const restoreWindowSize = useCallback(
    (appId: string) => {
      storeRestoreWindowSize(appId);
    },
    [storeRestoreWindowSize]
  );

  const toggleWindow = useCallback(
    (appId: string) => {
      const w = windows.find((win) => win.id === appId);
      if (!w || !w.isOpen) {
        storeOpenWindow(appId);
      } else {
        storeCloseWindow(appId);
      }
    },
    [windows, storeOpenWindow, storeCloseWindow]
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

  const toggleControlSurface = useCallback(
    (appId: string, side?: ControlSurfaceSide) => {
      storeToggleControlSurface(appId, side);
    },
    [storeToggleControlSurface]
  );

  const setControlSurfaceOpen = useCallback(
    (appId: string, open: boolean, side?: ControlSurfaceSide) => {
      storeSetControlSurfaceOpen(appId, open, side);
    },
    [storeSetControlSurfaceOpen]
  );

  // Queries
  const isWindowOpen = useCallback(
    (appId: string): boolean => {
      const w = windows.find((win) => win.id === appId);
      return w?.isOpen ?? false;
    },
    [windows]
  );

  const isWindowFullscreen = useCallback(
    (appId: string): boolean => {
      const w = windows.find((win) => win.id === appId);
      return w?.isFullscreen ?? false;
    },
    [windows]
  );

  const isWindowWidget = useCallback(
    (appId: string): boolean => {
      const w = windows.find((win) => win.id === appId);
      return w?.isWidget ?? false;
    },
    [windows]
  );

  const canRestoreWindow = useCallback(
    (appId: string): boolean => {
      const w = windows.find((win) => win.id === appId);
      return !!w?.preSnapState;
    },
    [windows]
  );

  const getWindowState = useCallback(
    (appId: string): WindowState | undefined => {
      return windows.find((win) => win.id === appId);
    },
    [windows]
  );

  const getActiveTab = useCallback(
    (appId: string): string | undefined => {
      return windows.find((win) => win.id === appId)?.activeTab;
    },
    [windows]
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
    openWindowWithZoom,
    closeWindow,
    focusWindow,
    toggleFullscreen,
    toggleWidget,
    toggleWindow,
    centerWindow,
    snapWindow,
    restoreWindowSize,
    updateWindowPosition,
    updateWindowSize,
    setActiveTab,
    toggleControlSurface,
    setControlSurfaceOpen,
    isWindowOpen,
    isWindowFullscreen,
    isWindowWidget,
    canRestoreWindow,
    getWindowState,
    getActiveTab,
    getTopWindow,
  };
}
