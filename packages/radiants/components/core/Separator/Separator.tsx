'use client';

import React from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type SeparatorOrientation = 'horizontal' | 'vertical';

interface SeparatorProps {
  /** Orientation of the separator */
  orientation?: SeparatorOrientation;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const separatorVariants = cva('bg-edge-primary shrink-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

// ============================================================================
// Component
// ============================================================================

/**
 * Accessible separator element for visually dividing content.
 * Uses Base UI Separator for proper `role="separator"` semantics.
 */
export function Separator({
  orientation = 'horizontal',
  className = '',
}: SeparatorProps) {
  return (
    <BaseSeparator
      orientation={orientation}
      className={separatorVariants({ orientation, className })}
    />
  );
}

export default Separator;
