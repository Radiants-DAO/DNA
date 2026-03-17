'use client';

import React, { createContext, use } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Checkmark, WarningFilled, CloseFilled, InfoFilled } from '@rdna/radiants/icons/generated';

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
  children?: React.ReactNode;
  className?: string;
}

interface AlertCloseProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Context + Default Icons
// ============================================================================

const AlertVariantContext = createContext<AlertVariant>('default');

const VARIANT_ICONS: Record<AlertVariant, React.ComponentType<{ size?: number; className?: string }> | null> = {
  default: null,
  success: Checkmark,
  warning: WarningFilled,
  error: CloseFilled,
  info: InfoFilled,
};

// ============================================================================
// Styles
// ============================================================================

export const alertVariants = cva(
  'p-4 border border-line rounded-xs shadow-raised text-main',
  {
    variants: {
      variant: {
        default: 'bg-page',
        success: 'bg-success dark:bg-page dark:border-success dark:shadow-[0_0_8px_var(--color-success)]',
        warning: 'bg-warning dark:bg-page dark:border-warning dark:shadow-[0_0_8px_var(--color-warning)]',
        error: 'bg-danger dark:bg-page dark:border-danger dark:shadow-[0_0_8px_var(--color-danger)]',
        info: 'bg-link dark:bg-page dark:border-link dark:shadow-[0_0_8px_var(--color-link)]',
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
  const variant = use(AlertVariantContext);
  const DefaultIcon = VARIANT_ICONS[variant];
  return (
    <div className={`flex-shrink-0 ${className}`}>
      {children ?? (DefaultIcon ? <DefaultIcon size={16} /> : null)}
    </div>
  );
}

function Content({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <div className={`flex-1 min-w-0 ${className}`}>{children}</div>;
}

function Title({ children, className = '' }: AlertChildProps): React.ReactElement {
  return (
    <h4 className={`text-sm font-heading uppercase tracking-tight leading-none mb-1 text-balance ${className}`}>
      {children}
    </h4>
  );
}

function Description({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <p className={`font-sans text-sm text-pretty ${className}`}>{children}</p>;
}

function Close({ children, onClick, className = '' }: AlertCloseProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-1 rounded hover:bg-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 ${className}`}
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
    <AlertVariantContext value={variant}>
      <div
        role="alert"
        data-rdna="alert"
        data-variant={variant}
        className={alertVariants({ variant, className })}
      >
        <div className="flex items-start gap-3">
          {children}
        </div>
      </div>
    </AlertVariantContext>
  );
}

// ============================================================================
// Export
// ============================================================================

export const Alert = { Root, Icon, Content, Title, Description, Close };

export default Alert;
