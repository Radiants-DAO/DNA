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
  group relative inline-flex items-center justify-center gap-[0.625em]
  font-mono font-bold uppercase
  border-0 cursor-pointer overflow-hidden
  transition-[color,background] duration-200
  focus:outline-none
  disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none
`;

const variantStyles = {
  primary: `
    bg-transparent text-[rgba(239,92,111,0.9)]
    tracking-[0.25em]

    before:absolute before:inset-0 before:pointer-events-none
    before:border-b before:border-b-[rgba(239,92,111,0.3)]
    before:transition-[border-color,box-shadow] before:duration-200

    after:absolute after:bottom-0 after:left-0 after:h-px after:w-0
    after:bg-[rgba(239,92,111,0.9)]
    after:transition-[width] after:duration-200

    hover:text-white
    hover:after:w-full
    hover:before:border-b-[rgba(239,92,111,0.8)]
    hover:before:shadow-[0_1px_0.6em_-2px_rgba(239,92,111,0.5)]
    hover:[text-shadow:0_0_0.6em_rgba(239,92,111,0.4)]

    active:text-[rgba(239,92,111,0.7)]
    active:after:bg-[rgba(239,92,111,0.5)]

    focus-visible:before:border-b-[var(--panel-accent-40)]
    focus-visible:before:shadow-[0_1px_0.4em_-1px_var(--panel-accent-40)]
  `,
  secondary: `
    bg-transparent text-[var(--panel-accent)]
    tracking-[0.25em]

    before:absolute before:inset-0 before:pointer-events-none
    before:border-b before:border-b-[rgba(180,148,247,0.25)]
    before:transition-[border-color,box-shadow] before:duration-200

    after:absolute after:bottom-0 after:left-0 after:h-px after:w-0
    after:bg-[rgba(180,148,247,0.9)]
    after:transition-[width] after:duration-200

    hover:text-white
    hover:after:w-full
    hover:before:border-b-[rgba(180,148,247,0.7)]
    hover:before:shadow-[0_1px_0.6em_-2px_rgba(105,57,202,0.5)]
    hover:[text-shadow:0_0_0.6em_rgba(105,57,202,0.4)]

    active:text-[rgba(180,148,247,0.7)]
    active:after:bg-[rgba(180,148,247,0.5)]

    focus-visible:before:border-b-[var(--panel-accent-40)]
    focus-visible:before:shadow-[0_1px_0.4em_-1px_var(--panel-accent-40)]
  `,
  outline: `
    bg-transparent text-[var(--panel-accent-65)]
    tracking-[0.2em]

    before:absolute before:inset-0 before:pointer-events-none
    before:border before:border-[rgba(180,148,247,0.2)]
    before:transition-[border-color,box-shadow] before:duration-200

    after:absolute after:inset-0 after:pointer-events-none after:opacity-0
    after:bg-[rgba(105,57,202,0.04)]
    after:transition-opacity after:duration-200

    hover:text-white
    hover:after:opacity-100
    hover:before:border-[rgba(180,148,247,0.5)]
    hover:before:shadow-[inset_0_0_0.8em_-4px_rgba(105,57,202,0.15),0_0_0.4em_-2px_rgba(105,57,202,0.2)]

    active:before:border-[rgba(180,148,247,0.7)]
    active:after:bg-[rgba(105,57,202,0.1)] active:after:opacity-100

    focus-visible:before:border-[var(--panel-accent-40)]
  `,
  ghost: `
    bg-transparent text-[var(--panel-accent-65)]
    tracking-[0.15em]

    before:absolute before:inset-0 before:pointer-events-none
    before:border-0 before:transition-[background] before:duration-200

    hover:text-[var(--panel-accent)]
    hover:before:bg-[var(--panel-accent-08)]
    hover:[text-shadow:0_0_0.4em_var(--panel-accent-30)]

    active:before:bg-[var(--panel-accent-15)]

    focus-visible:before:bg-[var(--panel-accent-08)]
  `,
  mono: `
    bg-[var(--gradient-accent)] text-main
    tracking-[0.2em]
    [text-shadow:0_0_0.15rem_rgba(255,255,255,0.3)]

    before:absolute before:inset-0 before:pointer-events-none
    before:border before:border-t-[var(--color-bevel-highlight)] before:border-l-[var(--color-bevel-highlight)]
    before:border-b-[var(--color-bevel-shadow)] before:border-r-[var(--color-bevel-shadow)]
    before:transition-[box-shadow,border-color] before:duration-200

    after:absolute after:inset-0 after:pointer-events-none after:opacity-0
    after:bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.03)_50%)] after:bg-[length:100%_4px]
    after:transition-opacity after:duration-200

    hover:bg-[var(--gradient-action-hover)]
    hover:before:shadow-[0_0_2rem_0_var(--color-accent)]
    hover:after:opacity-100
    hover:[text-shadow:0_0_0.3rem_rgba(255,255,255,0.5)]

    active:bg-[var(--gradient-action-active)]
    active:before:border-t-[var(--color-bevel-shadow)] active:before:border-l-[var(--color-bevel-shadow)]
    active:before:border-b-[var(--color-bevel-highlight)] active:before:border-r-[var(--color-bevel-highlight)]
    active:before:shadow-none
  `,
};

const sizeStyles = {
  sm: 'px-[0.875em] py-[0.5em] text-[0.625em] min-h-[2.25em]',
  md: 'px-[1.25em] py-[0.625em] text-[0.75em] min-h-[2.75em]',
  lg: 'px-[2em] py-[0.875em] text-[0.875em] min-h-[3.25em]',
};

const iconOnlySize = {
  sm: 'w-[2.25em] h-[2.25em] p-0',
  md: 'w-[2.75em] h-[2.75em] p-0',
  lg: 'w-[3.25em] h-[3.25em] p-0',
};

function LoadingPulse() {
  return (
    <span className="inline-flex items-center gap-[0.25em]">
      <span className="w-[0.35em] h-[0.35em] rounded-full bg-current animate-pulse" />
      <span className="w-[0.35em] h-[0.35em] rounded-full bg-current animate-pulse [animation-delay:75ms]" />
      <span className="w-[0.35em] h-[0.35em] rounded-full bg-current animate-pulse [animation-delay:150ms]" />
    </span>
  );
}

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
    <span className="relative z-[1] inline-flex items-center gap-[0.5em]">
      {loading ? (
        <LoadingPulse />
      ) : (
        <>
          {children}
          {icon && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </span>
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