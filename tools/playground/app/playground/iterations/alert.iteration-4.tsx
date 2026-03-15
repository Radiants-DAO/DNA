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
  'px-3 py-2 border rounded-sm bg-surface-muted',
  {
    variants: {
      variant: {
        default: 'border-edge-muted text-content-primary',
        success: 'border-status-success text-content-primary',
        warning: 'border-status-warning text-content-primary',
        error: 'border-status-error text-content-primary',
        info: 'border-status-info text-content-primary',
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
  return <div className={`flex-shrink-0 ${className}`}>{children}</div>;
}

function Content({ children, className = '' }: AlertChildProps): React.ReactElement {
  return (
    <div className={`flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0 ${className}`}>
      {children}
    </div>
  );
}

function Title({ children, className = '' }: AlertChildProps): React.ReactElement {
  return (
    <span className={`text-xs font-heading uppercase tracking-tight leading-none ${className}`}>
      {children}
    </span>
  );
}

function Description({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <span className={`font-sans text-sm text-content-secondary text-pretty ${className}`}>{children}</span>;
}

function Close({ children, onClick, className = '' }: AlertCloseProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-0.5 rounded-xs hover:bg-hover-overlay transition-colors duration-fast cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1 ${className}`}
      aria-label="Close alert"
    >
      {children ?? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <div className="flex items-center gap-2">
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