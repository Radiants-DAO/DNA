'use client';

import React from 'react';
import { Icon } from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert content */
  children: React.ReactNode;
  /** Show close button */
  closable?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Icon name (filename without .svg extension) - overrides variant default */
  iconName?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-surface-primary text-content-primary',
  success: 'bg-status-success/10 text-content-primary',
  warning: 'bg-status-warning/10 text-content-primary',
  error: 'bg-status-error/10 text-content-primary',
  info: 'bg-status-info/10 text-content-primary',
};

const variantIconMap: Record<AlertVariant, string> = {
  default: 'information-circle',
  success: 'checkmark-filled',
  warning: 'warning-triangle-filled-2',
  error: 'close',
  info: 'information-circle',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Alert component - Static alert banners
 */
export function Alert({
  variant = 'default',
  title,
  children,
  closable = false,
  onClose,
  iconName,
  className = '',
}: AlertProps) {
  const displayIconName = iconName || variantIconMap[variant];

  return (
    <div
      role="alert"
      className={`
        p-4
        border border-edge-primary
        rounded-none
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="flex-shrink-0 mt-0.5">
          <Icon name={displayIconName} size={16} />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <small className="font-alfacad text-sm uppercase font-bold mb-1 block">
              {title}
            </small>
          )}
          <div className="font-alfacad text-sm text-content-primary/80">
            {children}
          </div>
        </div>

        {/* Close Button */}
        {closable && (
          <button
            onClick={onClose}
            className="text-content-primary/50 hover:text-content-primary flex-shrink-0 -mt-1"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
