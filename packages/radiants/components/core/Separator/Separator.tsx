'use client';

import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type SeparatorOrientation = 'horizontal' | 'vertical';
type SeparatorVariant = 'solid' | 'dashed' | 'decorated';

interface SeparatorProps {
  /** Orientation of the separator */
  orientation?: SeparatorOrientation;
  /** Visual variant */
  variant?: SeparatorVariant;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const separatorVariants = cva('shrink-0', {
  variants: {
    orientation: {
      horizontal: 'w-full',
      vertical: 'h-full',
    },
    variant: {
      solid: 'bg-rule',
      dashed: 'border-rule border-dashed',
      decorated: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', variant: 'solid', className: 'h-px' },
    { orientation: 'vertical', variant: 'solid', className: 'w-px' },
    { orientation: 'horizontal', variant: 'dashed', className: 'border-t' },
    { orientation: 'vertical', variant: 'dashed', className: 'border-l' },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
  },
});

// ============================================================================
// Component
// ============================================================================

/**
 * Accessible separator element for visually dividing content.
 * Uses Base UI Separator for proper `role="separator"` semantics.
 *
 * Supports solid, dashed, and decorated (diamond ornament) variants.
 */
export function Separator({
  orientation = 'horizontal',
  variant = 'solid',
  className = '',
}: SeparatorProps) {
  if (variant === 'decorated') {
    return (
      <div
        data-rdna="separator"
        role="separator"
        aria-orientation={orientation}
        className={`flex items-center gap-4 ${className}`}
      >
        <div className="flex-1 border-t border-rule" />
        <div className="w-2 h-2 bg-accent border-rule rotate-45" />
        <div className="flex-1 border-t border-rule" />
      </div>
    );
  }

  return (
    <BaseSeparator
      data-rdna="separator"
      orientation={orientation}
      className={separatorVariants({ orientation, variant, className })}
    />
  );
}
