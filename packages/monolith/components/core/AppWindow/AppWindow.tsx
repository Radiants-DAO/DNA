'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useWindowManager } from '../../../hooks/useWindowManager';

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

/** Close button with pixel X icon */
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center justify-center
        w-[1.5em] h-[1.5em] min-w-[1.5em]
        border border-line
        bg-page
        cursor-pointer
        transition-colors duration-200
        hover:bg-[#fce184]
      "
      aria-label="Close window"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="11"
        viewBox="0 0 10 11"
        fill="none"
        className="w-[0.625em] h-[0.6875em]"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.11111 0.5H0V1.61111H1.11111V2.72222H2.22222V3.83333H3.33333V4.94444H4.44444V6.05556H3.33333V7.16667H2.22222V8.27778H1.11111V9.38889H0V10.5H1.11111H2.22222V9.38889H3.33333V8.27778H4.44444V7.16667H5.55556V8.27778H6.66667V9.38889H7.77778V10.5H8.88889H10V9.38889H8.88889V8.27778H7.77778V7.16667H6.66667V6.05556H5.55556V4.94444H6.66667V3.83333H7.77778V2.72222H8.88889V1.61111H10V0.5H8.88889H7.77778V1.61111H6.66667V2.72222H5.55556V3.83333H4.44444V2.72222H3.33333V1.61111H2.22222V0.5H1.11111Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

/** Taskbar / Title bar component */
function WindowTaskbar({
  title,
  onClose,
  actionButton,
}: {
  title: string;
  onClose: () => void;
  actionButton?: AppWindowProps['actionButton'];
}) {
  return (
    <div
      className="
        flex items-center gap-[0.25em]
        px-[1em] py-[0.25em]
        border-b border-line
        bg-page
        cursor-move select-none
      "
      data-drag-handle
    >
      {/* Title */}
      <div className="flex-shrink-0">
        <span className="text-[1em] leading-none text-center whitespace-nowrap text-main font-ui">
          {title}
        </span>
      </div>

      {/* Decorative lines */}
      <div className="flex-1 flex items-center gap-[0.25em] px-[0.5em]">
        <div className="flex-1 h-[1px] bg-rule" />
      </div>

      {/* Buttons container */}
      <div className="flex items-center gap-[0.25em]">
        {/* Action button if provided */}
        {actionButton && (
          <a
            href={actionButton.href}
            target={actionButton.target}
            onClick={actionButton.onClick}
            className="
              inline-flex items-center gap-[0.5em]
              px-[1em] py-[0.5em]
              bg-page
              text-main
              text-[0.875em]
              font-bold
              uppercase
              border border-line
              rounded-[0.25em]
              shadow-btn
              cursor-pointer
              transition-all duration-200
              hover:bg-accent-soft
              hover:shadow-btn-hover
              hover:-translate-y-[2px]
              active:shadow-none
              active:translate-y-[2px]
            "
          >
            {actionButton.text}
          </a>
        )}

        {/* Close button */}
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
          absolute
          pointer-events-auto
          border border-line
          rounded-[0.5em]
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
          // Glassmorphic background
          background: 'linear-gradient(225deg, rgba(141, 255, 240, 0.7), rgba(20, 241, 178, 0.5))',
          backdropFilter: 'blur(0.25em)',
          boxShadow: 'inset 0 0 5em 0 transparent, 0 2px 0 0 var(--color-ocean)',
        }}
        onMouseDown={handleFocus}
        tabIndex={-1}
        data-app-window={id}
        data-resizable={resizable}
        // Hover glow effect via CSS
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            'inset 0 0 5em 0 rgba(0, 180, 159, 0.97), 0 2px 0 0 var(--color-ocean)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            'inset 0 0 5em 0 transparent, 0 2px 0 0 var(--color-ocean)';
        }}
      >
        {/* Title Bar */}
        <WindowTaskbar
          title={title}
          onClose={handleClose}
          actionButton={actionButton}
        />

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-auto px-[0.5em] py-[0.25em] pb-[0.5em]"
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
