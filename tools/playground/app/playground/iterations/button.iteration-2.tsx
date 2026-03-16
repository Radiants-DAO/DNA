'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

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

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-[0.5em]',
    'font-mono font-bold uppercase tracking-[0.12em]',
    'border cursor-pointer',
    'transition-[background,border-color,box-shadow,transform,color] duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--panel-accent-40)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black)]',
    'disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[rgba(239,92,111,0.05)] text-[rgba(239,92,111,1)]',
          'border-[rgba(239,92,111,0.2)]',
          'shadow-[0_2px_0_0_var(--black),inset_0_1px_0_rgba(239,92,111,0.06)]',
          'hover:bg-[rgba(239,92,111,0.18)] hover:text-white',
          'hover:border-[rgba(239,92,111,0.8)]',
          'hover:border-b-[var(--black)] hover:border-r-[var(--black)]',
          'hover:shadow-[0_3px_0_0_var(--black),0_0_0.8em_rgba(239,92,111,0.3),0_0_2em_rgba(239,92,111,0.1)]',
          'hover:-translate-y-[2px]',
          'active:bg-[rgba(239,92,111,0.25)] active:translate-y-0',
          'active:shadow-[inset_0_2px_4px_rgba(239,92,111,0.2)]',
          'active:border-[rgba(239,92,111,0.6)]',
        ].join(' '),
        secondary: [
          'bg-[var(--panel-accent-08)] text-[var(--panel-accent)]',
          'border-[var(--panel-accent-15)]',
          'shadow-[0_2px_0_0_var(--black),inset_0_1px_0_var(--panel-accent-08)]',
          'hover:bg-[rgba(105,57,202,0.22)] hover:text-white',
          'hover:border-[rgba(180,148,247,0.8)]',
          'hover:border-b-[var(--black)] hover:border-r-[var(--black)]',
          'hover:shadow-[0_3px_0_0_var(--black),0_0_0.8em_rgba(105,57,202,0.4),0_0_2em_rgba(105,57,202,0.15)]',
          'hover:-translate-y-[2px]',
          'active:bg-[rgba(105,57,202,0.3)] active:translate-y-0',
          'active:shadow-[inset_0_2px_4px_rgba(105,57,202,0.3)]',
          'active:border-[rgba(180,148,247,0.6)]',
        ].join(' '),
        outline: [
          'bg-transparent text-[var(--panel-accent-65)]',
          'border-[rgba(180,148,247,0.5)]',
          'shadow-[0_2px_0_0_var(--black)]',
          'hover:bg-[rgba(105,57,202,0.1)] hover:text-white',
          'hover:border-[rgba(180,148,247,0.9)]',
          'hover:border-b-[var(--black)] hover:border-r-[var(--black)]',
          'hover:shadow-[0_3px_0_0_var(--black),0_0_0.6em_rgba(105,57,202,0.3)]',
          'hover:-translate-y-[2px]',
          'active:bg-[rgba(105,57,202,0.15)] active:translate-y-0',
          'active:shadow-[inset_0_1px_3px_rgba(105,57,202,0.2)]',
          'active:border-[rgba(180,148,247,0.4)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[var(--panel-accent-65)]',
          'border-transparent shadow-none',
          'hover:bg-[var(--panel-accent-08)] hover:text-[var(--panel-accent)]',
          'hover:border-[var(--panel-accent-15)]',
          'hover:[text-shadow:0_0_0.5em_var(--panel-accent-30)]',
          'active:bg-[var(--panel-accent-15)]',
          'active:border-[var(--panel-accent-30)]',
        ].join(' '),
        mono: [
          'bg-[var(--gradient-accent)] text-main',
          '[border-top-color:var(--color-bevel-highlight)]',
          '[border-left-color:var(--color-bevel-highlight)]',
          '[border-bottom-color:var(--color-bevel-shadow)]',
          '[border-right-color:var(--color-bevel-shadow)]',
          'shadow-btn',
          '[text-shadow:0_0_0.1rem_rgba(255,255,255,0.2)]',
          'hover:bg-[var(--gradient-action-hover)]',
          'hover:shadow-[0_0_1.8rem_0_var(--color-accent),0_0.25rem_0_0_var(--color-flip)]',
          'hover:-translate-y-[0.125rem]',
          'active:bg-[var(--gradient-action-active)]',
          'active:shadow-none active:translate-y-[0.125rem]',
          'active:[border-top-color:var(--color-bevel-shadow)]',
          'active:[border-left-color:var(--color-bevel-shadow)]',
          'active:[border-bottom-color:var(--color-bevel-highlight)]',
          'active:[border-right-color:var(--color-bevel-highlight)]',
        ].join(' '),
      },
      size: {
        sm: 'px-[0.75em] py-[0.375em] text-[0.75em] min-h-[2em]',
        md: 'px-[1.125em] py-[0.5em] text-[0.875em] min-h-[2.5em]',
        lg: 'px-[1.75em] py-[0.75em] text-[1em] min-h-[3em]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const iconOnlySize = {
  sm: 'w-[2em] h-[2em] !p-0',
  md: 'w-[2.5em] h-[2.5em] !p-0',
  lg: 'w-[3em] h-[3em] !p-0',
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
    buttonVariants({ variant, size }),
    iconOnly && iconOnlySize[size],
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinner = (
    <svg className="w-[1em] h-[1em] animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const content = loading ? (
    <span className="inline-flex">{spinner}</span>
  ) : (
    <>
      {children}
      {icon && <span className="shrink-0 inline-flex">{icon}</span>}
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
    <button type="button" className={styles} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export default Button;