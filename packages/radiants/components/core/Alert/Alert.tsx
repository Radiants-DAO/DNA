'use client';

import React, { createContext, use } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Checkmark, CommentsBlank, WarningFilled, CloseFilled, Close as CloseIcon, InfoFilled } from '@rdna/radiants/icons/generated';
import { Button } from '@rdna/radiants/components/core/Button/Button';

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
  default: CommentsBlank,
  success: Checkmark,
  warning: WarningFilled,
  error: CloseFilled,
  info: InfoFilled,
};

// ============================================================================
// Styles
// ============================================================================

export const alertVariants = cva(
  'p-4 border border-line rounded-xs text-main',
  {
    variants: {
      variant: {
        default: 'bg-page shadow-raised',
        success: 'bg-success shadow-raised',
        warning: 'bg-warning shadow-raised',
        error: 'bg-danger shadow-raised',
        info: 'bg-link shadow-raised',
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
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      onClick={onClick}
      aria-label="Close alert"
      className={`flex-shrink-0 ${className}`}
    >
      {children ?? <CloseIcon size={14} />}
    </Button>
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
