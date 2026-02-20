'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface Web3ShellProps {
  /** Footer bar element — typically <Web3ActionBar ... /> */
  actionBar: React.ReactNode;
  /** Main content area (WindowContent, WindowTabs, or custom) */
  children: React.ReactNode;
  /** Additional classes on the root div */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Web3Shell({ actionBar, children, className = '' }: Web3ShellProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
      {actionBar}
    </div>
  );
}
