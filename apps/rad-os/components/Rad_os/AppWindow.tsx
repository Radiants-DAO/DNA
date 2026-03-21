'use client';

import React, { useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useWindowManager } from '@/hooks/useWindowManager';
import { resolveWindowSize, remToPx } from '@/lib/constants';
import type { WindowSizeTier, WindowSize } from '@/lib/constants';
import { WindowTitleBar } from './WindowTitleBar';

// ============================================================================
// Constants
// ============================================================================

const MIN_SIZE = { width: 300, height: 200 };
const TASKBAR_HEIGHT = 48;
const TITLE_BAR_HEIGHT = 40;
const TAB_BAR_HEIGHT = 48;
const CHROME_PADDING = 16;
const CASCADE_OFFSET = 30;

/** Small margin to prevent window from touching viewport edges */
const EDGE_MARGIN = 8;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate the maximum allowed window dimensions based on viewport.
 * Height = viewport - taskbar (full available space)
 * Width = viewport - small margin
 */
function getMaxWindowSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 };
  }

  // Max height is full desktop area (viewport minus taskbar)
  const maxHeight = window.innerHeight - TASKBAR_HEIGHT;
  // Max width is full viewport minus small margin
  const maxWidth = window.innerWidth - EDGE_MARGIN * 2;

  return {
    width: Math.floor(maxWidth),
    height: Math.floor(maxHeight),
  };
}

/**
 * Calculate the max content area height (subtracting window chrome).
 * This is used for the scroll container's max-height.
 */
function getMaxContentHeight(): number {
  const maxWindow = getMaxWindowSize();
  // Subtract title bar and some padding for borders/margins
  return maxWindow.height - TITLE_BAR_HEIGHT - CHROME_PADDING;
}

// ============================================================================
// Types
// ============================================================================

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: import('@/lib/constants').WindowSizeTier | import('@/lib/constants').WindowSize;
  resizable?: boolean;
  className?: string;
  /** Icon to display in the title bar */
  icon?: React.ReactNode;
  /** Add bottom padding to content area (default: true) */
  contentPadding?: boolean;
  /** Show the widget mode button in the title bar */
  showWidgetButton?: boolean;
  /** Callback when widget button is clicked */
  onWidget?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Draggable and resizable window container for apps
 *
 * Features:
 * - Draggable via title bar
 * - Resizable via handles on edges and corners
 * - Click-to-focus (z-index management)
 * - Close and fullscreen toggle buttons
 * - Auto-sizes to fit content (up to max viewport size)
 *
 * @example
 * <AppWindow id="brand" title="Brand & Press">
 *   <BrandAssetsContent />
 * </AppWindow>
 */
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
  showWidgetButton,
  onWidget,
}: AppWindowProps) {
  // Resolve defaultSize tier/object to CSS rem strings
  const resolvedCSSSize = defaultSize ? resolveWindowSize(defaultSize) : undefined;

  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const lastCenteredSizeRef = useRef<{ width: number; height: number } | null>(null);

  const {
    getWindowState,
    closeWindow,
    toggleFullscreen,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    openWindows,
  } = useWindowManager();

  // Refs to avoid dependency cycles in effects (must be after hook calls)
  const openWindowsRef = useRef(0);
  const updatePositionRef = useRef(updateWindowPosition);
  const updateSizeRef = useRef(updateWindowSize);

  const windowState = getWindowState(id);
  const isFullscreen = windowState?.isFullscreen ?? false;
  const isWidget = windowState?.isWidget ?? false;
  const isFocused = windowState?.zIndex !== undefined
    && openWindows.every(w => w.zIndex <= windowState.zIndex);

  // Keep refs updated (to avoid dependency cycles in effects)
  openWindowsRef.current = openWindows.filter(w => w.id !== id).length;
  updatePositionRef.current = updateWindowPosition;
  updateSizeRef.current = updateWindowSize;

  // Calculate effective max sizes based on viewport
  const getEffectiveMaxSize = useCallback(() => {
    return getMaxWindowSize();
  }, []);

  const [isResizing, setIsResizing] = useState(false);
  const [hasAutoSized, setHasAutoSized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
  });
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // Handle window focus on click - brings window to front
  const handleFocus = useCallback(() => {
    focusWindow(id);
  }, [focusWindow, id]);

  // Handle click anywhere on window to bring to front
  const handleWindowClick = useCallback((e: React.MouseEvent) => {
    // Bring window to front on any click
    // This doesn't interfere with other interactions (buttons, links, etc.)
    focusWindow(id);
  }, [focusWindow, id]);

  // Handle close
  const handleClose = useCallback(() => {
    closeWindow(id);
  }, [closeWindow, id]);

  // Handle fullscreen toggle
  const handleFullscreen = useCallback(() => {
    toggleFullscreen(id);
  }, [toggleFullscreen, id]);

  // Handle drag stop - update position in state
  const handleDragStop = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      setHasUserInteracted(true); // User manually moved window
      updateWindowPosition(id, { x: data.x, y: data.y });
    },
    [id, updateWindowPosition]
  );

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!nodeRef.current) return;

    const rect = nodeRef.current.getBoundingClientRect();
    const currentPos = windowState?.position || defaultPosition;

    setIsResizing(true);
    setHasUserInteracted(true); // User manually resizing
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      positionX: currentPos.x,
      positionY: currentPos.y,
    });

    focusWindow(id);
  }, [focusWindow, id, windowState, defaultPosition]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!nodeRef.current) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const effectiveMax = getEffectiveMaxSize();

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.positionX;
      let newY = resizeStart.positionY;

      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes('e')) {
        newWidth = Math.min(Math.max(resizeStart.width + deltaX, MIN_SIZE.width), effectiveMax.width);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.min(Math.max(resizeStart.width - deltaX, MIN_SIZE.width), effectiveMax.width);
        newX = resizeStart.positionX + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.min(Math.max(resizeStart.height + deltaY, MIN_SIZE.height), effectiveMax.height);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.min(Math.max(resizeStart.height - deltaY, MIN_SIZE.height), effectiveMax.height);
        newY = resizeStart.positionY + (resizeStart.height - newHeight);
      }

      // Update size in state
      updateWindowSize(id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });

      // Update position if resizing from left or top
      if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
        updateWindowPosition(id, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, resizeDirection, getEffectiveMaxSize, id, updateWindowSize, updateWindowPosition]);

  // Use ResizeObserver to watch for size changes and recenter
  // This handles async content loading (images, etc.)
  useEffect(() => {
    // Skip if user has interacted (dragged/resized), or window has explicit size
    if (hasUserInteracted || windowState?.size || resolvedCSSSize || !nodeRef.current) {
      return;
    }

    // Helper to center window - uses refs to avoid dependency cycles
    const centerWindowAtSize = (width: number, height: number) => {
      if (typeof window === 'undefined') return;

      const maxSize = getMaxWindowSize();
      const clampedWidth = Math.min(Math.max(width, MIN_SIZE.width), maxSize.width);
      const clampedHeight = Math.min(Math.max(height, MIN_SIZE.height), maxSize.height);

      const viewportWidth = window.innerWidth;
      const desktopHeight = window.innerHeight - TASKBAR_HEIGHT;

      // Get cascade offset from ref (avoids dependency cycle)
      const otherWindowCount = openWindowsRef.current;
      const cascadeX = otherWindowCount * CASCADE_OFFSET;
      const cascadeY = otherWindowCount * CASCADE_OFFSET;

      let centeredX = (viewportWidth - clampedWidth) / 2 + cascadeX;
      let centeredY = (desktopHeight - clampedHeight) / 2 + cascadeY;

      // Ensure window stays on screen
      centeredX = Math.max(0, Math.min(centeredX, viewportWidth - clampedWidth));
      centeredY = Math.max(0, Math.min(centeredY, desktopHeight - clampedHeight));

      // Use refs to call store functions (avoids dependency cycle)
      updatePositionRef.current(id, {
        x: Math.round(centeredX),
        y: Math.round(centeredY),
      });

      // Update last centered size
      lastCenteredSizeRef.current = { width: clampedWidth, height: clampedHeight };

      // Only update window size if we need to clamp (content exceeds max)
      if (height > maxSize.height || width > maxSize.width) {
        updateSizeRef.current(id, {
          width: Math.round(clampedWidth),
          height: Math.round(clampedHeight),
        });
      }
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      // Only recenter if size actually changed significantly (> 10px)
      const lastSize = lastCenteredSizeRef.current;
      if (lastSize &&
          Math.abs(width - lastSize.width) < 10 &&
          Math.abs(height - lastSize.height) < 10) {
        return;
      }

      centerWindowAtSize(width, height);
    });

    observer.observe(nodeRef.current);

    // Also do an initial centering
    const rect = nodeRef.current.getBoundingClientRect();
    centerWindowAtSize(rect.width, rect.height);

    return () => observer.disconnect();
  }, [hasUserInteracted, windowState?.size, resolvedCSSSize, id]);

  // Reset state when window closes (so it re-centers on reopen)
  useEffect(() => {
    if (!windowState?.isOpen) {
      setHasAutoSized(false);
      setHasUserInteracted(false);
      lastCenteredSizeRef.current = null;
    }
  }, [windowState?.isOpen]);

  // Don't render if window is not open
  // This check must be AFTER all hooks are called!
  if (!windowState?.isOpen) {
    return null;
  }

  // Don't render if window is in widget mode (content lives elsewhere)
  if (isWidget) {
    return null;
  }

  const effectiveMax = getEffectiveMaxSize();
  const viewportMaxContentHeight = getMaxContentHeight();

  // Container queries require explicit width — fit-content windows can't use them
  // because container-type: inline-size prevents content-based sizing
  const hasExplicitWidth = !!(windowState?.size?.width ?? resolvedCSSSize?.width);

  // Derive content max-height from actual window height when available,
  // falling back to viewport-based max for fit-content windows
  const actualWindowHeight = windowState?.size?.height
    ?? (resolvedCSSSize ? remToPx(resolvedCSSSize.height) : undefined);
  const maxContentHeight = actualWindowHeight
    ? actualWindowHeight - TITLE_BAR_HEIGHT - CHROME_PADDING
    : viewportMaxContentHeight;

  // Fullscreen mode - fixed positioning covering viewport
  if (isFullscreen) {
    return (
      <div
        ref={nodeRef}
        role="dialog"
        aria-labelledby={`window-title-${id}`}
        className={`
          fixed inset-0
          pointer-events-auto
          border border-line
          overflow-hidden
          flex flex-col
          p-0
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus
          ${className}
        `}
        style={{
          zIndex: windowState?.zIndex || 100,
          background: 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
        }}
        onMouseDown={handleFocus}
        onClick={handleWindowClick}
        tabIndex={-1}
        data-app-window={id}
        data-fullscreen="true"
        data-focused={isFocused || undefined}
      >
        {/* Title Bar (no drag handle in fullscreen) */}
        <div ref={titleBarRef}>
          <WindowTitleBar
            title={title}
            windowId={id}
            onClose={handleClose}
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            icon={icon}
            showWidgetButton={showWidgetButton}
            onWidget={onWidget}
            isWidget={isWidget}
          />
        </div>


        {/* Content (fullscreen doesn't need max-height constraint) */}
        <div
          ref={contentRef}
          className="flex-1 min-h-0 @container"
        >
          {children}
        </div>
      </div>
    );
  }

  // Normal windowed mode
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="[data-drag-handle]"
      position={windowState?.position || defaultPosition}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
    >
      <div
        ref={nodeRef}
        role="dialog"
        aria-labelledby={`window-title-${id}`}
        className={`
          absolute
          pointer-events-auto
          pixel-corners
          flex flex-col
          p-0
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus
          ${className}
        `}
        style={{
          position: 'absolute',
          width: windowState?.size?.width ?? resolvedCSSSize?.width ?? 'fit-content',
          height: windowState?.size?.height ?? resolvedCSSSize?.height ?? 'fit-content',
          minWidth: MIN_SIZE.width,
          minHeight: MIN_SIZE.height,
          maxWidth: effectiveMax.width,
          maxHeight: effectiveMax.height,
          zIndex: windowState?.zIndex || 100,
          background: 'linear-gradient(0deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
          filter: 'drop-shadow(4px 4px 0 var(--color-ink))',
        }}
        onMouseDown={handleFocus}
        onClick={handleWindowClick}
        tabIndex={-1}
        data-app-window={id}
        data-resizable={resizable}
        data-focused={isFocused || undefined}
      >
        {/* Title Bar */}
        <div ref={titleBarRef}>
          <WindowTitleBar
            title={title}
            windowId={id}
            onClose={handleClose}
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            icon={icon}
            showWidgetButton={showWidgetButton}
            onWidget={onWidget}
            isWidget={isWidget}
          />
        </div>


        {/* Content - exposes max height as CSS variable for scroll containers */}
        <div
          ref={contentRef}
          className={`flex-1 min-h-0${hasExplicitWidth ? ' @container' : ''}${contentPadding ? ' pb-2' : ''}`}
          style={{
            // CSS variable for child scroll containers to cap their height
            '--app-content-max-height': `${maxContentHeight}px`,
          } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Resize Handles - only render if resizable is true */}
        {resizable && (
          <>
            {/* Corner handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />

            {/* Edge handles */}
            <div
              className="absolute top-0 left-3 right-3 h-1 cursor-ns-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-1 cursor-ns-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute left-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute right-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
          </>
        )}
      </div>
    </Draggable>
  );
}

export default AppWindow;
