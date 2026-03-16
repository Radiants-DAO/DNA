'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const baseStyles = `
  border
  border-[rgba(180,148,247,0.8)]
  border-b-[var(--bevel-lo)] border-r-[var(--bevel-lo)]
  transition-all duration-200
`;

const variantStyles = {
  default: `
    bg-[rgba(1,1,1,0.85)]
    shadow-[0_0_2em_var(--panel-accent-08),inset_0_0_2em_rgba(0,0,0,0.5)]
    hover:shadow-[0_0_2em_var(--panel-accent-20),inset_0_0_2em_rgba(0,0,0,0.5)]
  `,
  elevated: `
    bg-[rgba(1,1,1,0.85)]
    shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_1px_var(--panel-accent-30)]
    hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_1em_var(--panel-accent-20)]
    hover:-translate-y-px
  `,
  glass: `
    bg-[rgba(1,1,1,0.6)] backdrop-blur-[1.5em]
    shadow-[0_0_2em_var(--panel-accent-08),inset_0_0_2em_rgba(0,0,0,0.5)]
    hover:shadow-[0_0_2em_var(--panel-accent-20),inset_0_0_2em_rgba(0,0,0,0.5)]
    hover:-translate-y-px
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-[0.5em]',
  md: 'p-[1em]',
  lg: 'p-[1.5em]',
};

export function Card({ children, variant = 'default', padding = 'md', className = '' }: CardProps) {
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-2 mb-3 pb-3 border-b border-b-[var(--panel-accent-15)] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h4 className={`font-mono text-lg text-main uppercase tracking-wider [text-shadow:0_0_0.4em_var(--panel-accent-30)] ${className}`}>
      {children}
    </h4>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-sub ${className}`}>{children}</div>;
}

export default Card;
