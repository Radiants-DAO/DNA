'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useWindowManager } from '../hooks/useWindowManager';

// ============================================================================
// Constants
// ============================================================================

const MIN_SIZE = { width: 300, height: 200 };
const TASKBAR_HEIGHT = 48;
const TITLE_BAR_HEIGHT = 40;
const EDGE_MARGIN = 8;

// ============================================================================
// Helpers
// ============================================================================

function getMaxWindowSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 };
  }
  const maxHeight = window.innerHeight - TASKBAR_HEIGHT;
  const maxWidth = window.innerWidth - EDGE_MARGIN * 2;
  return { width: Math.floor(maxWidth), height: Math.floor(maxHeight) };
}

// ============================================================================
// Types
// ============================================================================

interface AppWindowProps {
  /** Unique window identifier */
  id: string;
  /** Window title displayed in taskbar */
  title: string;
  /** Window content */
  children: React.ReactNode;
  /** Initial position */
  defaultPosition?: { x: number; y: number };
  /** Initial size (if not provided, window sizes to content) */
  defaultSize?: { width: number; height: number };
  /** Enable window resizing */
  resizable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Icon element for the title bar */
  icon?: React.ReactNode;
  /** Callback when close is requested */
  onClose?: () => void;
  /** Custom action button config */
  actionButton?: {
    text: string;
    onClick?: () => void;
    href?: string;
    target?: string;
  };
}

// ============================================================================
// Subcomponents
// ============================================================================

/** Close button with CRT-style X icon */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="close_button"
      aria-label="Close window"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
      <span className="close-button-tooltip">Close</span>
    </button>
  );
}

/** Taskbar / Title bar component */
function WindowTaskbar({
  title,
  icon,
  onClose,
  actionButton,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  actionButton?: AppWindowProps['actionButton'];
}) {
  return (
    <div className="taskbar_wrap" data-drag-handle>
      <div className="taskbar_title">
        {icon && <span style={{ marginRight: '0.4em', display: 'flex' }}>{icon}</span>}
        <span className="taskbar_text">{title}</span>
      </div>
      <div className="taskbar_lines-wrap">
        <div className="taskbar_line" />
        <div className="taskbar_line" />
      </div>
      <div className="taskbar_button-wrap">
        {actionButton && (
          <a
            href={actionButton.href}
            target={actionButton.target}
            onClick={actionButton.onClick}
            className="modal-cta-button modal-cta-magma"
            style={{ textDecoration: 'none' }}
          >
            {actionButton.text}
          </a>
        )}
        <CloseButton onClick={onClose} />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Draggable window component with glassmorphic styling
 *
 * Features:
 * - Draggable via title bar
 * - Resizable via handles (if enabled)
 * - Click-to-focus (z-index management)
 * - Glassmorphic gradient background with hover glow
 * - Monolith CRT aesthetic
 *
 * @example
 * <AppWindow id="rules" title="Notifications">
 *   <form>...</form>
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
  actionButton,
  onClose,
}: AppWindowProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    getWindowState,
    closeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useWindowManager();

  const windowState = getWindowState(id);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
  });
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // Handle window focus
  const handleFocus = useCallback(() => {
    focusWindow(id);
  }, [focusWindow, id]);

  // Handle close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    closeWindow(id);
  }, [closeWindow, id, onClose]);

  // Handle drag stop
  const handleDragStop = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      updateWindowPosition(id, { x: data.x, y: data.y });
    },
    [id, updateWindowPosition]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!nodeRef.current) return;

      const rect = nodeRef.current.getBoundingClientRect();
      const currentPos = windowState?.position || defaultPosition;

      setIsResizing(true);
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
    },
    [focusWindow, id, windowState, defaultPosition]
  );

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!nodeRef.current) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const maxSize = getMaxWindowSize();

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.positionX;
      let newY = resizeStart.positionY;

      if (resizeDirection.includes('e')) {
        newWidth = Math.min(Math.max(resizeStart.width + deltaX, MIN_SIZE.width), maxSize.width);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.min(Math.max(resizeStart.width - deltaX, MIN_SIZE.width), maxSize.width);
        newX = resizeStart.positionX + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.min(Math.max(resizeStart.height + deltaY, MIN_SIZE.height), maxSize.height);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.min(Math.max(resizeStart.height - deltaY, MIN_SIZE.height), maxSize.height);
        newY = resizeStart.positionY + (resizeStart.height - newHeight);
      }

      updateWindowSize(id, { width: Math.round(newWidth), height: Math.round(newHeight) });

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
  }, [isResizing, resizeStart, resizeDirection, id, updateWindowSize, updateWindowPosition]);

  // Don't render if window is not open
  if (!windowState?.isOpen) {
    return null;
  }

  const maxSize = getMaxWindowSize();

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
          absolute app-window
          pointer-events-auto
          overflow-hidden
          flex flex-col
          min-w-[20em] max-w-[77em]
          min-h-[20em] max-h-[90vh]
          focus:outline-none
          transition-shadow duration-500
          ${className}
        `}
        style={{
          width: windowState?.size?.width ?? defaultSize?.width ?? 'fit-content',
          height: windowState?.size?.height ?? defaultSize?.height ?? 'fit-content',
          minWidth: MIN_SIZE.width,
          minHeight: MIN_SIZE.height,
          maxWidth: maxSize.width,
          maxHeight: maxSize.height,
          zIndex: windowState?.zIndex || 100,
        }}
        onMouseDown={handleFocus}
        tabIndex={-1}
        data-app-window={id}
        data-resizable={resizable}
      >
        {/* Title Bar */}
        <WindowTaskbar
          title={title}
          icon={icon}
          onClose={handleClose}
          actionButton={actionButton}
        />

        {/* Content */}
        <div
          ref={contentRef}
          className="app_contents"
        >
          {children}
        </div>

        {/* Resize Handles */}
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
