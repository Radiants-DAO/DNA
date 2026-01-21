'use client';

import React, { useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface HelpPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Help content to display */
  children: React.ReactNode;
  /** Optional title for the help panel */
  title?: string;
  /** Close button slot - renders your own close button/icon */
  closeButton?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Slide-in help panel that appears from the right side of the window.
 * Used to display contextual help content within app windows.
 *
 * Uses slot-based API for the close button to avoid coupling to specific
 * icon systems. Pass your own button component via the `closeButton` prop.
 */
export function HelpPanel({
  isOpen,
  onClose,
  children,
  title = 'Help',
  closeButton,
  className = '',
}: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close on open click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        absolute inset-0 z-50
        bg-surface-secondary/20
        flex justify-center items-center
      `}
    >
      <div
        ref={panelRef}
        className={`
          h-full w-full max-w-4xl
          bg-surface-primary
          border border-edge-primary
          shadow-card-lg
          flex flex-col
          animate-slide-in-right
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge-primary">
          <span className="font-joystix text-xs text-content-primary uppercase">
            {title}
          </span>
          {closeButton ? (
            <span onClick={onClose} className="cursor-pointer">
              {closeButton}
            </span>
          ) : (
            <button
              onClick={onClose}
              className="text-content-primary/50 hover:text-content-primary p-1"
              aria-label="Close help panel"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="font-mondwest text-base text-content-primary space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
