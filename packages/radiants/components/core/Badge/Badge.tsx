'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';


// ============================================================================
// CVA Variants
// ============================================================================

export const badgeVariants = cva(
  'inline-flex items-center justify-center font-mono uppercase tracking-tight leading-none whitespace-nowrap tabular-nums',
  {
    variants: {
      variant: {
        default: 'bg-page text-main',
        success: 'bg-success text-accent-inv',
        warning: 'bg-warning text-accent-inv',
        error: 'bg-danger text-accent-inv',
        info: 'bg-link text-accent-inv',
      },
      size: {
        sm: 'px-1 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ============================================================================
// Types
// ============================================================================

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  /** Badge content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Badge component for status indicators and labels
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={badgeVariants({ variant, size, className: `pixel-rounded-xs pixel-shadow-raised inline-block ${className}`.trim() })}
      data-rdna="badge"
      data-slot="badge"
      data-variant={variant}
    >
      {children}
    </span>
  );
}

export default Badge;
