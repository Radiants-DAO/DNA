'use client';

import React from 'react';
import { ScrollArea } from '@rdna/radiants/components/core';

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
  /** Background class (default: 'bg-surface-elevated') */
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
  bgClassName = 'bg-surface-elevated',
  noScroll = false,
}: WindowContentProps) {
  const shellClasses = [
    'h-full',
    bordered ? 'border border-edge-primary rounded' : '',
    bgClassName,
  ].filter(Boolean).join(' ');

  const paddingClass = PADDING_MAP[padding];

  if (noScroll) {
    return (
      <div className={`flex-1 min-h-0 mx-2 ${className}`}>
        <div
          className={[shellClasses, paddingClass].filter(Boolean).join(' ')}
          style={{ maxHeight: 'var(--app-content-max-height, none)' }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-h-0 mx-2 ${className}`}>
      <ScrollArea.Root
        className={shellClasses}
        style={{ maxHeight: 'var(--app-content-max-height, none)' } as React.CSSProperties}
      >
        <ScrollArea.Viewport>
          {paddingClass ? <div className={paddingClass}>{children}</div> : children}
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  );
}
