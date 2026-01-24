'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type InfoChipVariant = 'default' | 'outline' | 'filled';
type InfoChipSize = 'sm' | 'md';

interface InfoChipProps {
  /** Chip content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: InfoChipVariant;
  /** Size preset */
  size?: InfoChipSize;
  /** Optional icon (emoji or component) */
  icon?: React.ReactNode;
  /** Click handler (makes it interactive) */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional classes */
  className?: string;
}

interface InfoChipGroupProps {
  /** Chips to display */
  children: React.ReactNode;
  /** Gap between chips */
  gap?: 'sm' | 'md';
  /** Wrap chips */
  wrap?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  inline-flex items-center
  font-joystix
  whitespace-nowrap
  rounded-sm
`;

const variantStyles: Record<InfoChipVariant, string> = {
  default: 'bg-transparent border border-black text-black',
  outline: 'bg-transparent border border-black/50 text-black/70',
  filled: 'bg-warm-cloud border border-black text-black',
};

const sizeStyles: Record<InfoChipSize, string> = {
  sm: 'px-2 py-0.5 text-sm gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
};

const interactiveStyles = `
  cursor-pointer
  hover:bg-sun-yellow hover:border-black
  active:bg-sun-yellow/80
  focus:outline-none focus-visible:ring-2 focus-visible:ring-sun-yellow focus-visible:ring-offset-1
`;

// ============================================================================
// Component
// ============================================================================

/**
 * InfoChip component for displaying small metadata items
 *
 * Based on Figma admin panel design showing:
 * - "1XP = $0.0001"
 * - "Total stake: 90 SOL"
 * - "Average Lock duration: 1.5 years"
 *
 * Features:
 * - Compact metadata display
 * - Optional icon
 * - Interactive variant with click handler
 * - Two size presets
 */
export function InfoChip({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  onClick,
  disabled = false,
  className = '',
}: InfoChipProps) {
  const classes = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    onClick && !disabled ? interactiveStyles : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const Element = onClick ? 'button' : 'span';

  return (
    <Element
      className={classes}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={onClick ? disabled : undefined}
      type={onClick ? 'button' : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </Element>
  );
}

// ============================================================================
// InfoChipGroup - For displaying multiple chips
// ============================================================================

/**
 * InfoChipGroup component for displaying rows of chips
 */
export function InfoChipGroup({
  children,
  gap = 'sm',
  wrap = true,
  className = '',
}: InfoChipGroupProps) {
  const gapStyles = {
    sm: 'gap-1',
    md: 'gap-2',
  };

  return (
    <div
      className={`
        flex items-center
        ${gapStyles[gap]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default InfoChip;
