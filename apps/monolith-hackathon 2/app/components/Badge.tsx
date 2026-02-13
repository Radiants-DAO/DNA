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
  font-ui uppercase tracking-wider
  rounded-xs
  whitespace-nowrap
`;

const sizeStyles = {
  sm: 'px-[0.5em] py-[0.125em] text-2xs',
  md: 'px-[0.75em] py-[0.25em] text-xs',
};

const variantStyles = {
  default: 'bg-surface-muted text-content-primary',
  success: 'bg-status-success text-content-inverted',
  warning: 'bg-status-warning text-content-inverted',
  error: 'bg-status-error text-content-inverted',
  info: 'bg-status-info text-content-inverted',
  custom: '',
};

export function Badge({ children, variant = 'default', color, size = 'sm', className = '' }: BadgeProps) {
  const styles = [baseStyles, sizeStyles[size], variantStyles[variant], className].filter(Boolean).join(' ');
  const inlineStyle = variant === 'custom' && color ? { backgroundColor: color, color: 'var(--color-content-inverted)' } : undefined;

  return (
    <span className={styles} style={inlineStyle}>
      {children}
    </span>
  );
}

export default Badge;
