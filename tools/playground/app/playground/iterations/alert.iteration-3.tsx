'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface AlertRootProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

interface AlertChildProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertCloseProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

export const alertVariants = cva(
  'px-5 py-4 border rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-surface-primary border-edge-primary text-content-primary shadow-raised',
        success: 'bg-surface-primary border-status-success text-content-primary shadow-glow-success',
        warning: 'bg-surface-primary border-status-warning text-content-primary shadow-raised',
        error: 'bg-surface-primary border-status-error text-content-primary shadow-glow-error',
        info: 'bg-surface-primary border-status-info text-content-primary shadow-glow-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ============================================================================
// Sub-components
// ============================================================================

function Icon({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <div className={`flex-shrink-0 mt-0.5 ${className}`}>{children}</div>;
}

function Content({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <div className={`flex-1 min-w-0 flex flex-col gap-1 ${className}`}>{children}</div>;
}

function Title({ children, className = '' }: AlertChildProps): React.ReactElement {
  return (
    <h4 className={`text-base font-heading uppercase tracking-tight leading-none text-balance ${className}`}>
      {children}
    </h4>
  );
}

function Description({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <p className={`font-sans text-sm text-content-secondary text-pretty ${className}`}>{children}</p>;
}

function Close({ children, onClick, className = '' }: AlertCloseProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-1 rounded-sm hover:bg-hover-overlay transition-colors duration-fast cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1 ${className}`}
      aria-label="Close alert"
    >
      {children ?? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  );
}

// ============================================================================
// Root
// ============================================================================

function Root({ variant = 'default', children, className = '' }: AlertRootProps): React.ReactElement {
  return (
    <div
      role="alert"
      data-variant={variant}
      className={alertVariants({ variant, className })}
    >
      <div className="flex items-start gap-3">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export const Alert = { Root, Icon, Content, Title, Description, Close };

export default Alert;