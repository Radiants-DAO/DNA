'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'custom';
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const baseStyles = `
  inline-flex items-center justify-center
  font-mono uppercase tracking-wider
  border
  whitespace-nowrap
  [text-shadow:0_0_0.4em_var(--panel-accent-30)]
`;

const sizeStyles = {
  sm: 'px-[0.5em] py-[0.125em] text-2xs',
  md: 'px-[0.75em] py-[0.25em] text-xs',
};

const variantStyles = {
  default: `
    bg-[var(--panel-accent-08)] text-[var(--panel-accent-65)]
    border-[rgba(180,148,247,0.3)]
    border-b-[var(--bevel-lo)] border-r-[var(--bevel-lo)]
  `,
  success: `
    bg-[rgba(74,222,128,0.08)] text-[rgba(74,222,128,0.9)]
    border-[rgba(74,222,128,0.3)]
    border-b-[rgba(34,100,58,0.8)] border-r-[rgba(34,100,58,0.8)]
    [text-shadow:0_0_0.4em_rgba(74,222,128,0.3)]
  `,
  warning: `
    bg-[rgba(253,143,58,0.08)] text-[rgba(253,143,58,0.9)]
    border-[rgba(253,143,58,0.3)]
    border-b-[rgba(140,70,20,0.8)] border-r-[rgba(140,70,20,0.8)]
    [text-shadow:0_0_0.4em_rgba(253,143,58,0.3)]
  `,
  error: `
    bg-[rgba(239,92,111,0.08)] text-[rgba(239,92,111,0.9)]
    border-[rgba(239,92,111,0.3)]
    border-b-[rgba(120,40,50,0.8)] border-r-[rgba(120,40,50,0.8)]
    [text-shadow:0_0_0.4em_rgba(239,92,111,0.3)]
  `,
  info: `
    bg-[rgba(105,57,202,0.08)] text-[rgba(139,92,246,0.9)]
    border-[rgba(139,92,246,0.3)]
    border-b-[rgba(60,30,110,0.8)] border-r-[rgba(60,30,110,0.8)]
    [text-shadow:0_0_0.4em_rgba(139,92,246,0.3)]
  `,
  custom: '',
};

export function Badge({ children, variant = 'default', color, size = 'sm', className = '' }: BadgeProps) {
  const styles = [baseStyles, sizeStyles[size], variantStyles[variant], className].filter(Boolean).join(' ');
  const inlineStyle = variant === 'custom' && color ? { backgroundColor: color, color: 'var(--color-flip)' } : undefined;

  return (
    <span className={styles} style={inlineStyle}>
      {children}
    </span>
  );
}

export default Badge;
