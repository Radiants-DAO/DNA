'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// CVA Variants
// ============================================================================

export const badgeVariants = cva(
  'inline-flex items-center justify-center font-heading uppercase tracking-tight leading-none rounded-xs whitespace-nowrap border border-edge-primary tabular-nums',
  {
    variants: {
      variant: {
        default: 'bg-surface-primary text-content-primary',
        success: 'bg-status-success text-action-secondary',
        warning: 'bg-status-warning text-action-secondary',
        error: 'bg-status-error text-action-secondary',
        info: 'bg-status-info text-action-secondary',
      },
      size: {
        sm: 'px-3 py-0.5 text-xs',
        md: 'px-3.5 py-1 text-sm',
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
      className={badgeVariants({ variant, size, className })}
      data-slot="badge"
      data-variant={variant}
    >
      {children}
    </span>
  );
}

export default Badge;
