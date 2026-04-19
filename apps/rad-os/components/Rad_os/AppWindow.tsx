'use client';

import React, { useCallback } from 'react';
import { AppWindow as CoreAppWindow } from '@rdna/radiants/components/core';
import { useWindowManager } from '@/hooks/useWindowManager';
import type { SnapRegion } from '@/hooks/useWindowManager';
import { resolveWindowSize } from '@/lib/windowSizing';
import type { WindowSizeTier, WindowSize } from '@/lib/windowSizing';

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: WindowSizeTier | WindowSize;
  resizable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  contentPadding?: boolean;
  showWidgetButton?: boolean;
  onWidget?: () => void;
}

export function AppWindow({
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 50 },
  defaultSize,
  resizable = true,
  className = '',
  icon,
  contentPadding = true,
  showWidgetButton = false,
  onWidget,
}: AppWindowProps) {
  const {
    getWindowState,
    closeWindow,
    toggleFullscreen,
    focusWindow,
    centerWindow,
    snapWindow,
    restoreWindowSize,
    canRestoreWindow,
    updateWindowPosition,
    updateWindowSize,
    openWindows,
  } = useWindowManager();

  const windowState = getWindowState(id);
  const resolvedSize = defaultSize ? resolveWindowSize(defaultSize) : undefined;
  const topZIndex = openWindows.reduce((max, windowItem) => Math.max(max, windowItem.zIndex), 0);
  const cascadeIndex = openWindows.filter((windowItem) => windowItem.id !== id).length;
  const handleClose = useCallback(() => closeWindow(id), [closeWindow, id]);
  const handleFocus = useCallback(() => focusWindow(id), [focusWindow, id]);
  const handleFullscreen = useCallback(() => toggleFullscreen(id), [toggleFullscreen, id]);
  const handleCenter = useCallback(() => centerWindow(id), [centerWindow, id]);
  const handleSnap = useCallback(
    (region: SnapRegion) => snapWindow(id, region),
    [id, snapWindow],
  );
  const handleRestore = useCallback(() => restoreWindowSize(id), [id, restoreWindowSize]);
  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => updateWindowPosition(id, position),
    [id, updateWindowPosition],
  );
  const handleSizeChange = useCallback(
    (size: { width: number; height: number }) => updateWindowSize(id, size),
    [id, updateWindowSize],
  );

  return (
    <CoreAppWindow
      id={id}
      title={title}
      open={windowState?.isOpen ?? false}
      presentation={windowState?.isFullscreen ? 'fullscreen' : 'window'}
      position={windowState?.position}
      defaultPosition={defaultPosition}
      size={windowState?.size ?? resolvedSize}
      defaultSize={resolvedSize}
      resizable={resizable}
      className={className}
      icon={icon}
      contentPadding={contentPadding}
      showWidgetButton={showWidgetButton}
      widgetActive={windowState?.isWidget ?? false}
      focused={(windowState?.zIndex ?? 0) === topZIndex}
      zIndex={windowState?.zIndex}
      autoCenter={!windowState?.size && !resolvedSize}
      cascadeIndex={cascadeIndex}
      onWidget={onWidget}
      onClose={handleClose}
      onFocus={handleFocus}
      onFullscreen={handleFullscreen}
      onCenter={handleCenter}
      onSnap={handleSnap}
      onRestore={handleRestore}
      canRestore={canRestoreWindow(id)}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
    >
      {children}
    </CoreAppWindow>
  );
}

export default AppWindow;
