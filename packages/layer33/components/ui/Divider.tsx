'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type DividerOrientation = 'horizontal' | 'vertical';
type DividerVariant = 'solid' | 'dashed' | 'decorated' | 'mix-blend';

interface DividerProps {
  /** Orientation */
  orientation?: DividerOrientation;
  /** Visual variant */
  variant?: DividerVariant;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Divider component for separating content
 */
export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  className = '',
}: DividerProps) {
  // Decorated variant with diamond in center
  if (variant === 'decorated') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-edge-secondary" />
        <div className="w-2 h-2 bg-action-primary border border-edge-primary rotate-45" />
        <div className="flex-1 h-px bg-edge-secondary" />
      </div>
    );
  }

  // Horizontal divider
  if (orientation === 'horizontal') {
    const borderStyle = variant === 'dashed' ? 'border-dashed' : 'border-solid';
    const bgClass = variant === 'mix-blend'
      ? 'bg-surface-primary mix-blend-difference'
      : variant === 'dashed'
        ? 'bg-transparent border-t border-dashed border-edge-secondary'
        : 'bg-edge-secondary';

    return (
      <div
        className={`w-full h-px ${bgClass} ${className}`}
        role="separator"
        aria-orientation="horizontal"
      />
    );
  }

  // Vertical divider
  return (
    <div
      className={`w-px bg-edge-secondary ${variant === 'dashed' ? 'border-l border-dashed border-edge-secondary bg-transparent' : ''} ${className}`}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export default Divider;

