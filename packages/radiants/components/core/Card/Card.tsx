'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type CardVariant = 'default' | 'dark' | 'raised';

interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Card content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
  /** @deprecated Use className to control padding instead */
  noPadding?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const cardVariants = cva(
  'border border-edge-primary rounded-md overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-surface-primary text-content-primary',
        dark: 'bg-surface-secondary text-content-inverted',
        raised: 'bg-surface-primary text-content-primary shadow-raised',
      },
      noPadding: {
        true: '',
        false: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      noPadding: false,
    },
  }
);

// ============================================================================
// Component
// ============================================================================

/**
 * Card container component with consistent styling
 */
export function Card({
  variant = 'default',
  children,
  className = '',
  noPadding = false,
}: CardProps) {
  const classes = cardVariants({
    variant,
    noPadding,
    className,
  });

  return (
    <div className={classes} data-rdna="card" data-variant={variant}>
      {children}
    </div>
  );
}

// ============================================================================
// Card Sub-components
// ============================================================================

/**
 * Card header with bottom border
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-edge-primary ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card body with standard padding
 */
export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card footer with top border
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-4 py-3 border-t border-edge-primary ${className}`}>
      {children}
    </div>
  );
}

export default Card;
