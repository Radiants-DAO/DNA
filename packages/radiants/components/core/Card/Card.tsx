'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import type { CardRounded, CardVariant } from './Card.meta';



// ============================================================================
// Types (enums re-exported from ./Card.meta)
// ============================================================================

export type { CardRounded, CardVariant };

const CARD_PIXEL_CLASS: Record<CardRounded, string> = {
  sm: 'pixel-rounded-6',
  md: 'pixel-rounded-8',
  lg: 'pixel-rounded-12',
};

interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Pixel-corner roundness */
  rounded?: CardRounded;
  /** Card content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// CVA Variants — layout only; colors owned by CSS on data-slot/data-variant
// ============================================================================

export const cardVariants = cva(
  '',
  {
    variants: {
      rounded: {
        sm: 'pixel-rounded-6',
        md: 'pixel-rounded-8',
        lg: 'pixel-rounded-12',
      },
    },
    defaultVariants: {
      rounded: 'lg',
    },
  }
);

// ============================================================================
// Component
// ============================================================================

/**
 * Card container with retro pixel-corner bevels.
 * Colors and bevels are theme-owned via CSS on data-slot/data-variant.
 * Use CardHeader, CardBody, CardFooter for structured layouts,
 * or pass padding via className for simple content.
 */
export function Card({
  variant = 'default',
  rounded = 'lg',
  children,
  className = '',
}: CardProps) {
  const shadowClass = variant === 'raised' ? 'pixel-shadow-raised' : '';
  return (
    <div
      data-rdna="card"
      data-slot="card"
      data-variant={variant}
      className={`${CARD_PIXEL_CLASS[rounded]} ${shadowClass} ${className}`.trim()}
    >
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
export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-4 py-3 border-b border-line ${className}`} data-slot="card-header">
      {children}
    </div>
  );
}

/**
 * Card body with standard padding
 */
export function CardBody({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`p-4 ${className}`} data-slot="card-body">
      {children}
    </div>
  );
}

/**
 * Card footer with top border
 */
export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-4 py-3 border-t border-line ${className}`} data-slot="card-footer">
      {children}
    </div>
  );
}
