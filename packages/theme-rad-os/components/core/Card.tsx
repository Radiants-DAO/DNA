'use client';

import React, { useState, useMemo } from 'react';

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
  /** Optional padding override */
  noPadding?: boolean;
  /** Enable hover effects with motion tokens */
  interactive?: boolean;
  /** Optional click handler (implies interactive) */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  border border-edge-primary
  rounded-md
  overflow-hidden
`;

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-surface-primary text-content-primary
  `,
  dark: `
    bg-surface-secondary text-content-inverted
  `,
  raised: `
    bg-surface-primary text-content-primary
    shadow-card
  `,
};

// Motion-aware styles using CSS custom properties
// --transition-base respects duration-scalar (instant in light mode, animated in dark mode)
const motionStyles: React.CSSProperties = {
  transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Card container component with consistent styling
 *
 * Supports motion tokens for hover effects:
 * - interactive: enables hover lift/shadow effect
 * - onClick: makes card clickable (implies interactive)
 */
export function Card({
  variant = 'default',
  children,
  className = '',
  noPadding = false,
  interactive = false,
  onClick,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // If onClick is provided, card is automatically interactive
  const isInteractive = interactive || Boolean(onClick);

  const classes = [
    baseStyles,
    variantStyles[variant],
    noPadding ? '' : 'p-4',
    isInteractive ? 'cursor-pointer' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Compute dynamic motion styles based on hover state
  // Only raised and interactive cards get hover effects
  const dynamicStyles = useMemo((): React.CSSProperties => {
    if (!isInteractive) {
      return {};
    }

    // Interactive cards get motion transitions
    if (isHovered) {
      return {
        ...motionStyles,
        transform: 'translateY(calc(-1 * var(--lift-distance)))',
        boxShadow: 'var(--shadow-card-hover)',
      };
    }

    return {
      ...motionStyles,
      transform: 'translateY(0)',
    };
  }, [isInteractive, isHovered]);

  // Non-interactive cards render without motion handlers
  if (!isInteractive) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <div
      className={classes}
      style={dynamicStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Card Sub-components
// ============================================================================

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card header with bottom border
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`px-4 py-3 border-b border-edge-primary ${className}`}>{children}</div>;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card body with standard padding
 */
export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card footer with top border
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`px-4 py-3 border-t border-edge-primary ${className}`}>{children}</div>;
}

export default Card;
export type { CardVariant, CardProps };
