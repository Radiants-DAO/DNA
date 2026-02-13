'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type CardVariant = 'default' | 'dark' | 'grey';

interface CardProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Card content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
  /** Optional padding override */
  noPadding?: boolean;
  /** Disable hover effects */
  disableHover?: boolean;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Styles
// ============================================================================


/**
 * Variant styles
 * - default: white bg, black text, neutral-1 hover (matches button styling)
 * - dark: black bg, white text, pixel shadow
 * - grey: grey bg, black text, pixel shadow
 */
const variantBaseStyles: Record<CardVariant, string> = {
  default: `
    bg-white text-black
    border border-black
    rounded-none
    overflow-hidden
    shadow-[2px_2px_0_0_var(--color-black)]
    outline outline-1 outline-transparent
    transition-all duration-500 ease-in-out
    relative
  `,
  dark: `
    bg-black text-white
    border border-white
    rounded-none
    overflow-hidden
    shadow-[2px_2px_0_0_var(--color-neutral-neutral-3)]
    outline outline-1 outline-transparent
    transition-all duration-500 ease-in-out
    relative
  `,
  grey: `
    bg-neutral-neutral-2 text-black
    border border-black
    rounded-none
    overflow-hidden
    shadow-[2px_2px_0_0_var(--color-black)]
    outline outline-1 outline-transparent
    transition-all duration-500 ease-in-out
    relative
  `,
};

const variantHoverStyles: Record<CardVariant, string> = {
  default: `
    hover:bg-neutral-neutral-1 hover:text-black
    hover:rounded-[1px] hover:translate-y-[-0.5rem] hover:outline-neutral-neutral-3
  `,
  dark: '',
  grey: `
    hover:bg-neutral-neutral-1 hover:text-black
    hover:rounded-[1px] hover:translate-y-[-0.5rem] hover:outline-neutral-neutral-3
  `,
};

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
  disableHover = false,
  style,
}: CardProps) {
  // Determine padding based on variant
  // All variants inherit default padding (p-4) unless noPadding is true
  const paddingClass = noPadding ? '' : 'p-4';
  
  // Conditionally apply hover styles based on disableHover prop
  const hoverStyles = disableHover ? '' : variantHoverStyles[variant];

  const classes = [
    variantBaseStyles[variant],
    paddingClass,
    hoverStyles,
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className={classes} style={style}>
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
  return (
    <div className={`px-4 py-3 border-b border-black ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
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

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card footer with top border
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-4 py-3 border-t border-black ${className}`}>
      {children}
    </div>
  );
}

export default Card;

