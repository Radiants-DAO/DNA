'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Badge content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Base badge styles
 */
const baseStyles = `
  inline-flex items-center justify-center
  font-heading uppercase
  rounded-sm
  whitespace-nowrap
`;

/**
 * Size presets
 */
const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-3 py-0.5 text-2xs',
  md: 'px-3.5 py-1 text-xs',
};

/**
 * Variant color schemes (using semantic tokens)
 */
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-primary text-content-primary border border-edge-primary',
  success: 'bg-status-success text-ink border border-edge-primary',
  warning: 'bg-status-warning text-ink border border-edge-primary',
  error: 'bg-status-error text-ink border border-edge-primary',
  info: 'bg-status-info text-ink border border-edge-primary',
};

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
  const classes = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <span className={classes}>
      {children}
    </span>
  );
}

export default Badge;
