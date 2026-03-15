'use client';

import React from 'react';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type DividerOrientation = 'horizontal' | 'vertical';
type DividerVariant = 'solid' | 'dashed' | 'decorated';

interface DividerProps {
  /** Orientation */
  orientation?: DividerOrientation;
  /** Visual variant */
  variant?: DividerVariant;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const dividerVariants = cva('border-edge-muted', {
  variants: {
    orientation: {
      horizontal: 'w-full border-t',
      vertical: 'h-full border-l',
    },
    variant: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      decorated: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
  },
});

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
        <div className="flex-1 border-t border-edge-muted" />
        <div className="w-2 h-2 bg-action-primary border border-edge-primary rotate-45" />
        <div className="flex-1 border-t border-edge-muted" />
      </div>
    );
  }

  return (
    <div
      className={dividerVariants({ orientation, variant, className })}
      role="separator"
      aria-orientation={orientation}
    />
  );
}

export default Divider;
