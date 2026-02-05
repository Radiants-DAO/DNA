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

const baseStyles = `border border-edge-primary rounded-sm`;

const variantStyles = {
  default: 'bg-surface-elevated shadow-card',
  elevated: 'bg-surface-elevated shadow-card-lg',
  glass: `bg-[var(--gradient-glass)] backdrop-blur-md shadow-card hover:shadow-card-hover transition-shadow duration-200`,
};

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, variant = 'default', padding = 'md', className = '' }: CardProps) {
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`flex items-center gap-2 mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h4 className={`font-heading text-lg text-content-primary ${className}`}>{children}</h4>;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-content-secondary ${className}`}>{children}</div>;
}

export default Card;
