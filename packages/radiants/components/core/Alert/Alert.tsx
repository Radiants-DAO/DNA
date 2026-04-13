'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { Checkmark, CommentsBlank, WarningFilled, CloseFilled, Close as CloseIcon, InfoFilled } from '../../../icons/generated';
import { Button } from '../Button/Button';
import { createCompoundContext } from '../../shared/createCompoundContext';


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

const {
  Context: AlertVariantContext,
  useCompoundContext: useAlertVariantContext,
} = createCompoundContext<AlertVariant>('Alert');

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
  'p-4',
  {
    variants: {
      variant: {
        default: 'bg-page text-main',
        success: 'bg-success text-success',
        warning: 'bg-warning text-warning',
        error: 'bg-danger text-danger',
        info: 'bg-link text-link',
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
  const variant = useAlertVariantContext();
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
    <h4 className={`text-sm font-heading uppercase tracking-tight leading-none mb-1 text-balance text-main ${className}`}>
      {children}
    </h4>
  );
}

function Description({ children, className = '' }: AlertChildProps): React.ReactElement {
  return <p className={`font-sans text-sm text-pretty text-main ${className}`}>{children}</p>;
}

const VARIANT_TO_TONE: Record<AlertVariant, 'accent' | 'danger' | 'success' | 'neutral' | 'info'> = {
  default: 'neutral',
  success: 'success',
  warning: 'accent',
  error: 'danger',
  info: 'info',
};

function Close({ children, onClick, className = '' }: AlertCloseProps): React.ReactElement {
  const variant = useAlertVariantContext();
  const tone = VARIANT_TO_TONE[variant];
  return (
    <Button
      quiet
      size="sm"
      iconOnly
      tone={tone}
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
      <div role="alert" data-rdna="alert" data-variant={variant} className={alertVariants({ variant, className: `pixel-rounded-xs pixel-shadow-raised ${className}`.trim() })}>
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
