'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface WindowSidebarProps {
  /** Sidebar navigation content */
  nav: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Sidebar width in pixels (default: 192 = w-48) */
  width?: number;
  /** Additional classes on the root div */
  className?: string;
  /** Ref forwarded to the scrollable content area */
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Component
// ============================================================================

export function WindowSidebar({
  nav,
  children,
  width = 192,
  className = '',
  contentRef,
}: WindowSidebarProps) {
  return (
    <div
      className={`mx-2 h-full flex bg-card border border-line rounded max-h-[var(--app-content-max-height,none)] ${className}`}
    >
      <nav className="shrink-0 p-4 overflow-auto" style={{ width }}>
        {nav}
      </nav>
      <div ref={contentRef} className="flex-1 min-h-0 overflow-auto p-6 border-l border-line">
        {children}
      </div>
    </div>
  );
}
