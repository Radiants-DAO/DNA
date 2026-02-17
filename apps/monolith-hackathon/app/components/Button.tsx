'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  font-mono font-bold uppercase tracking-wider
  border
  cursor-pointer
  transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--panel-accent-40)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
`;

const variantStyles = {
  primary: `
    bg-[rgba(239,92,111,0.08)] text-[rgba(239,92,111,0.9)]
    border-[rgba(239,92,111,0.15)]
    shadow-[0_2px_0_0_var(--black)]
    hover:bg-[rgba(239,92,111,0.25)]
    hover:border-[rgba(239,92,111,1)]
    hover:border-b-[var(--black)] hover:border-r-[var(--black)]
    hover:shadow-[0_0_0.6em_rgba(239,92,111,0.4)]
    hover:-translate-y-px hover:text-white
    active:bg-[rgba(239,92,111,0.12)]
    active:translate-y-px
    active:border-[rgba(239,92,111,0.3)]
    active:shadow-[inset_0_0_0.4em_rgba(239,92,111,0.2)]
  `,
  secondary: `
    bg-[var(--panel-accent-08)] text-[var(--panel-accent-65)]
    border-[var(--panel-accent-15)]
    shadow-[0_2px_0_0_var(--black)]
    hover:bg-[rgba(105,57,202,0.3)]
    hover:border-[rgba(180,148,247,1)]
    hover:border-b-[var(--black)] hover:border-r-[var(--black)]
    hover:shadow-[0_0_0.6em_rgba(105,57,202,0.5)]
    hover:-translate-y-px hover:text-white
    active:bg-[rgba(105,57,202,0.15)]
    active:translate-y-px
    active:border-[var(--bevel-lo)]
    active:border-b-[rgba(180,148,247,0.8)] active:border-r-[rgba(180,148,247,0.8)]
    active:shadow-[inset_0_0_0.4em_rgba(105,57,202,0.3)]
  `,
  outline: `
    bg-transparent text-[var(--panel-accent-65)]
    border-[rgba(180,148,247,0.8)]
    border-b-[var(--bevel-lo)] border-r-[var(--bevel-lo)]
    shadow-[0_2px_0_0_var(--black)]
    hover:bg-[rgba(105,57,202,0.15)]
    hover:border-[rgba(180,148,247,1)]
    hover:border-b-[var(--black)] hover:border-r-[var(--black)]
    hover:shadow-[0_0_0.6em_rgba(105,57,202,0.5)]
    hover:-translate-y-px hover:text-white
    active:bg-[rgba(105,57,202,0.1)]
    active:translate-y-px
    active:border-[var(--bevel-lo)]
    active:border-b-[rgba(180,148,247,0.8)] active:border-r-[rgba(180,148,247,0.8)]
    active:shadow-[inset_0_0_0.4em_rgba(105,57,202,0.3)]
  `,
  ghost: `
    bg-transparent text-[var(--panel-accent-65)]
    border-transparent
    shadow-none
    hover:bg-[var(--panel-accent-08)] hover:text-[var(--panel-accent)]
    hover:[text-shadow:0_0_0.4em_var(--panel-accent-30)]
    active:bg-[var(--panel-accent-15)]
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
    hover:shadow-[0_0_2rem_0_var(--color-action-primary),0_0.25rem_0_0_var(--color-content-inverted)]
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
