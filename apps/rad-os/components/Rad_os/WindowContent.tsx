'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface WindowContentProps {
  children: React.ReactNode;
  /** Additional classes on the outer wrapper */
  className?: string;
  /** Content padding — none | sm (p-2) | md (p-4) | lg (p-6, default) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Show border + rounded corners (default: true) */
  bordered?: boolean;
  /** Background class (default: 'bg-white') */
  bgClassName?: string;
  /** Disable scrolling (default: false) */
  noScroll?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<string, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// ============================================================================
// Component
// ============================================================================

export function WindowContent({
  children,
  className = '',
  padding = 'lg',
  bordered = true,
  bgClassName = 'bg-white',
  noScroll = false,
}: WindowContentProps) {
  return (
    <div className={`flex-1 min-h-0 mx-2 ${className}`}>
      <div
        className={[
          'h-full',
          noScroll ? '' : 'overflow-auto',
          bordered ? 'border border-black rounded' : '',
          bgClassName,
          PADDING_MAP[padding],
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ maxHeight: 'var(--app-content-max-height, none)' }}
      >
        {children}
      </div>
    </div>
  );
}
