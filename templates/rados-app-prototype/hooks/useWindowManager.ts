'use client';

import { useCallback, useMemo } from 'react';
import { useAppStore, type WindowState } from '../store';

export type { WindowState } from '../store';

export function useWindowManager() {
  const windows = useAppStore((state) => state.windows);
  const storeOpenWindow = useAppStore((state) => state.openWindow);
  const storeCloseWindow = useAppStore((state) => state.closeWindow);
  const storeFocusWindow = useAppStore((state) => state.focusWindow);
  const storeToggleFullscreen = useAppStore((state) => state.toggleFullscreen);
  const storeToggleWidget = useAppStore((state) => state.toggleWidget);
  const storeUpdatePosition = useAppStore((state) => state.updateWindowPosition);
  const storeUpdateSize = useAppStore((state) => state.updateWindowSize);
  const storeSetActiveTab = useAppStore((state) => state.setActiveTab);

  const openWindows = useMemo(() => windows.filter((w) => w.isOpen), [windows]);

  const openWindow = useCallback((id: string) => storeOpenWindow(id), [storeOpenWindow]);
  const closeWindow = useCallback((id: string) => storeCloseWindow(id), [storeCloseWindow]);
  const focusWindow = useCallback((id: string) => storeFocusWindow(id), [storeFocusWindow]);
  const toggleFullscreen = useCallback((id: string) => storeToggleFullscreen(id), [storeToggleFullscreen]);
  const toggleWidget = useCallback((id: string) => storeToggleWidget(id), [storeToggleWidget]);

  const toggleWindow = useCallback(
    (id: string) => {
      const w = windows.find((win) => win.id === id);
      if (!w || !w.isOpen) storeOpenWindow(id);
      else storeCloseWindow(id);
    },
    [windows, storeOpenWindow, storeCloseWindow],
  );

  const updateWindowPosition = useCallback(
    (id: string, position: { x: number; y: number }) => storeUpdatePosition(id, position),
    [storeUpdatePosition],
  );

  const updateWindowSize = useCallback(
    (id: string, size: { width: number; height: number }) => storeUpdateSize(id, size),
    [storeUpdateSize],
  );

  const setActiveTab = useCallback(
    (id: string, tabId: string) => storeSetActiveTab(id, tabId),
    [storeSetActiveTab],
  );

  const isWindowOpen = useCallback(
    (id: string) => windows.find((w) => w.id === id)?.isOpen ?? false,
    [windows],
  );

  const isWindowFullscreen = useCallback(
    (id: string) => windows.find((w) => w.id === id)?.isFullscreen ?? false,
    [windows],
  );

  const isWindowWidget = useCallback(
    (id: string) => windows.find((w) => w.id === id)?.isWidget ?? false,
    [windows],
  );

  const getWindowState = useCallback(
    (id: string): WindowState | undefined => windows.find((w) => w.id === id),
    [windows],
  );

  const getActiveTab = useCallback(
    (id: string) => windows.find((w) => w.id === id)?.activeTab,
    [windows],
  );

  const getTopWindow = useCallback((): WindowState | undefined => {
    const visible = windows.filter((w) => w.isOpen);
    if (visible.length === 0) return undefined;
    return visible.reduce((top, cur) => (cur.zIndex > top.zIndex ? cur : top));
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
