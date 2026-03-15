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
  'px-3 py-2 border rounded-xs bg-surface-muted',
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
  return <div className={`flex-shrink-0 text-content-muted ${className}`}>{children}</div>;
}

function Content({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <div className={`flex-1 min-w-0 ${className}`}>{children}</div>;
}

function Title({ children, className = '' }: AlertChildProps): React.ReactElement {
  return (
    <h4 className={`text-xs font-heading uppercase tracking-widest leading-none mb-1 text-content-secondary ${className}`}>
      {children}
    </h4>
  );
}

function Description({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <p className={`font-sans text-sm text-content-primary text-pretty ${className}`}>{children}</p>;
}

function Close({ children, onClick, className = '' }: AlertCloseProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-1 rounded hover:bg-active-overlay transition-colors duration-fast cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1 text-content-muted hover:text-content-primary ${className}`}
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
      <div className="flex items-center gap-3">
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