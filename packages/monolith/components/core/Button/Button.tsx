'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mono';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Icon only (square button) */
  iconOnly?: boolean;
  /** Render as link */
  href?: string;
  /** Link target */
  target?: string;
  /** Icon element to render */
  icon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Button content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  inline-flex items-center justify-center gap-[0.5em]
  font-bold uppercase
  border border-edge-primary
  rounded-[0.25em]
  cursor-pointer
  transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
`;

const variantStyles = {
  primary: `
    bg-action-primary text-content-inverted
    shadow-btn
    hover:bg-action-accent hover:shadow-btn-hover hover:-translate-y-[2px]
    active:shadow-btn-active active:translate-y-[2px]
  `,
  secondary: `
    bg-action-secondary text-content-primary
    shadow-btn
    hover:bg-surface-elevated hover:shadow-btn-hover hover:-translate-y-[2px]
    active:shadow-btn-active active:translate-y-[2px]
  `,
  outline: `
    bg-transparent text-content-primary
    shadow-btn
    hover:bg-surface-primary/10 hover:shadow-btn-hover hover:-translate-y-[2px]
    active:shadow-btn-active active:translate-y-[2px]
  `,
  ghost: `
    bg-transparent text-content-primary border-transparent
    shadow-none
    hover:bg-surface-primary/10
    active:bg-surface-primary/20
  `,
  mono: `
    bg-[var(--gradient-action-primary)]
    text-content-primary
    [border-top-color:var(--color-bevel-highlight)]
    [border-left-color:var(--color-bevel-highlight)]
    [border-bottom-color:var(--color-bevel-shadow)]
    [border-right-color:var(--color-bevel-shadow)]
    shadow-btn
    [text-shadow:0_0_0.1rem_rgba(255,255,255,0.3)]
    hover:bg-[var(--gradient-action-hover)]
    hover:shadow-[0_0_2rem_0_var(--color-magma),0_0.25rem_0_0_var(--color-black)]
    hover:-translate-y-[0.125rem]
    active:bg-[var(--gradient-action-active)]
    active:shadow-none active:translate-y-[0.125rem]
    active:[border-top-color:var(--color-bevel-shadow)]
    active:[border-left-color:var(--color-bevel-shadow)]
    active:[border-bottom-color:var(--color-bevel-highlight)]
    active:[border-right-color:var(--color-bevel-highlight)]
  `,
};

const sizeStyles = {
  sm: 'px-[0.75em] py-[0.375em] text-[0.75em] min-h-[2em]',
  md: 'px-[1em] py-[0.5em] text-[0.875em] min-h-[2.5em]',
  lg: 'px-[1.5em] py-[0.75em] text-[1em] min-h-[3em]',
};

const iconOnlySize = {
  sm: 'w-[2em] h-[2em] p-0',
  md: 'w-[2.5em] h-[2.5em] p-0',
  lg: 'w-[3em] h-[3em] p-0',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Button component with Monolith retro styling
 *
 * Features:
 * - Retro lift/drop shadow effect
 * - Multiple variants: primary (magma), secondary (purple), outline, ghost, mono (gradient)
 * - Size presets: sm, md, lg
 * - Icon support
 * - Loading state
 * - Link rendering (href prop)
 *
 * @example
 * // Primary button
 * <Button variant="primary">Begin</Button>
 *
 * @example
 * // Button with icon
 * <Button variant="secondary" icon={<ArrowIcon />}>Next</Button>
 *
 * @example
 * // Button as link
 * <Button href="https://example.com" target="_blank">Visit Site</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  href,
  target,
  icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const styles = [
    baseStyles,
    variantStyles[variant],
    iconOnly ? iconOnlySize[size] : sizeStyles[size],
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <span className="animate-spin">
          <svg className="w-[1em] h-[1em]" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      ) : (
        <>
          {children}
          {icon && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </>
  );

  // Render as link if href is provided
  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={styles}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={styles}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}

export default Button;
