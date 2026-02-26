'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type StatCardVariant = 'default' | 'highlight' | 'dark';
type StatCardSize = 'sm' | 'md' | 'lg';
type StatCardLayout = 'vertical' | 'horizontal';

interface StatCardProps {
  /** Large value to display */
  value: string | number;
  /** Label/description text */
  label: string;
  /** Optional prefix (e.g., "$", "~") */
  prefix?: string;
  /** Optional suffix (e.g., "%", "SOL") */
  suffix?: string;
  /** Visual variant */
  variant?: StatCardVariant;
  /** Size preset */
  size?: StatCardSize;
  /** Layout direction */
  layout?: StatCardLayout;
  /** Optional trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  border border-edge-muted hover:border-edge-hover
  rounded-md
  overflow-hidden
  shadow-glow-sm
`;

const variantStyles: Record<StatCardVariant, string> = {
  default: 'bg-surface-primary',
  highlight: 'bg-sun-yellow',
  dark: 'bg-surface-secondary text-content-inverted',
};

const sizeStyles: Record<StatCardSize, {
  container: string;
  value: string;
  label: string;
  trend: string;
}> = {
  sm: {
    container: 'p-3',
    value: 'text-xl',
    label: 'text-xs',
    trend: 'text-2xs',
  },
  md: {
    container: 'p-4',
    value: 'text-3xl',
    label: 'text-xs',
    trend: 'text-xs',
  },
  lg: {
    container: 'p-6',
    value: 'text-5xl',
    label: 'text-sm',
    trend: 'text-sm',
  },
};

const trendStyles = {
  up: 'text-green',
  down: 'text-sun-red',
  neutral: 'text-content-muted',
};

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

// ============================================================================
// Component
// ============================================================================

/**
 * StatCard component for displaying large statistics
 *
 * Based on Figma admin panel design showing:
 * - "$184.84 / Solana Price"
 * - "7.84% / Validator APY"
 *
 * Features:
 * - Large value with prefix/suffix
 * - Label underneath
 * - Optional trend indicator
 * - Three size variants
 * - Horizontal or vertical layout
 */
export function StatCard({
  value,
  label,
  prefix,
  suffix,
  variant = 'default',
  size = 'md',
  layout = 'vertical',
  trend,
  className = '',
}: StatCardProps) {
  const styles = sizeStyles[size];

  const containerClasses = [
    baseStyles,
    variantStyles[variant],
    styles.container,
    layout === 'horizontal' ? 'flex items-center justify-between' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const textColor = variant === 'dark' ? 'text-content-inverted' : 'text-content-primary';

  return (
    <div className={containerClasses}>
      <div className={layout === 'horizontal' ? '' : ''}>
        {/* Value */}
        <div className={`font-mondwest ${styles.value} ${textColor} leading-none`}>
          {prefix && <span className="opacity-70">{prefix}</span>}
          {value}
          {suffix && <span className="opacity-70 ml-1">{suffix}</span>}
        </div>

        {/* Label */}
        <p className={layout === 'horizontal' ? '' : 'mt-1'}>
          {label}
        </p>
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={`
            flex items-center gap-1
            font-joystix ${styles.trend}
            ${trendStyles[trend.direction]}
            ${layout === 'horizontal' ? '' : 'mt-2'}
          `}
        >
          <span>{trendIcons[trend.direction]}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// StatCardGroup - For side-by-side stats
// ============================================================================

interface StatCardGroupProps {
  children: React.ReactNode;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Additional classes */
  className?: string;
}

export function StatCardGroup({
  children,
  columns = 2,
  className = '',
}: StatCardGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default StatCard;
