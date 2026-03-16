'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mono';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconOnly?: boolean;
  href?: string;
  target?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const baseStyles = `
  relative inline-flex items-center justify-center gap-[0.5em]
  font-mono font-bold uppercase tracking-[0.15em]
  cursor-pointer
  transition-[background,color,box-shadow,border-color] duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--panel-accent-40)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black)]
  disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
`;

const variantStyles = {
  primary: `
    bg-transparent text-[rgba(239,92,111,1)]
    border-l-2 border-l-[rgba(239,92,111,0.8)]
    border-t-0 border-r-0 border-b-0
    shadow-none
    hover:bg-[rgba(239,92,111,0.08)]
    hover:border-l-[rgba(239,92,111,1)]
    hover:shadow-[inset_3px_0_0.8em_-4px_rgba(239,92,111,0.25),-3px_0_1.2em_-4px_rgba(239,92,111,0.3)]
    hover:text-white
    active:bg-[rgba(239,92,111,0.15)]
    active:shadow-[inset_3px_0_1em_-3px_rgba(239,92,111,0.4)]
  `,
  secondary: `
    bg-transparent text-[var(--panel-accent)]
    border-l-2 border-l-[rgba(180,148,247,0.7)]
    border-t-0 border-r-0 border-b-0
    shadow-none
    hover:bg-[rgba(105,57,202,0.08)]
    hover:border-l-[rgba(180,148,247,1)]
    hover:shadow-[inset_3px_0_0.8em_-4px_rgba(105,57,202,0.25),-3px_0_1.2em_-4px_rgba(105,57,202,0.3)]
    hover:text-white
    active:bg-[rgba(105,57,202,0.15)]
    active:shadow-[inset_3px_0_1em_-3px_rgba(105,57,202,0.4)]
  `,
  outline: `
    bg-transparent text-[var(--panel-accent-65)]
    border-l-2 border-l-[rgba(180,148,247,0.4)]
    border-t-0 border-r-0 border-b-0
    shadow-none
    hover:bg-[rgba(105,57,202,0.06)]
    hover:border-l-[rgba(180,148,247,0.8)]
    hover:shadow-[inset_3px_0_0.6em_-4px_rgba(105,57,202,0.2)]
    hover:text-[var(--panel-accent)]
    active:bg-[rgba(105,57,202,0.12)]
    active:shadow-[inset_3px_0_0.8em_-3px_rgba(105,57,202,0.3)]
  `,
  ghost: `
    bg-transparent text-[var(--panel-accent-65)]
    border-l-2 border-l-transparent
    border-t-0 border-r-0 border-b-0
    shadow-none
    hover:text-[var(--panel-accent)]
    hover:border-l-[var(--panel-accent-30)]
    hover:bg-[var(--panel-accent-08)]
    active:bg-[var(--panel-accent-15)]
    active:border-l-[var(--panel-accent-65)]
  `,
  mono: `
    bg-[var(--gradient-accent)] text-main
    border-l-2 border-l-[var(--color-bevel-highlight)]
    border-t-0 border-r-0 border-b-0
    shadow-[inset_0_1px_0_var(--color-bevel-highlight),inset_0_-1px_0_var(--color-bevel-shadow)]
    [text-shadow:0_0_0.1rem_rgba(255,255,255,0.2)]
    hover:bg-[var(--gradient-action-hover)]
    hover:shadow-[inset_0_1px_0_var(--color-bevel-highlight),inset_0_-1px_0_var(--color-bevel-shadow),0_0_1.5rem_0_var(--color-accent)]
    active:bg-[var(--gradient-action-active)]
    active:shadow-[inset_0_-1px_0_var(--color-bevel-highlight),inset_0_1px_0_var(--color-bevel-shadow)]
    active:border-l-[var(--color-bevel-shadow)]
  `,
};

const sizeStyles = {
  sm: 'pl-[0.625em] pr-[0.75em] py-[0.375em] text-[0.75em] min-h-[2em]',
  md: 'pl-[0.875em] pr-[1em] py-[0.5em] text-[0.875em] min-h-[2.5em]',
  lg: 'pl-[1.25em] pr-[1.5em] py-[0.75em] text-[1em] min-h-[3em]',
};

const iconOnlySize = {
  sm: 'w-[2em] h-[2em] p-0 pl-0 pr-0',
  md: 'w-[2.5em] h-[2.5em] p-0 pl-0 pr-0',
  lg: 'w-[3em] h-[3em] p-0 pl-0 pr-0',
};

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
        <span className="inline-flex items-center">
          <svg className="w-[1em] h-[1em] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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