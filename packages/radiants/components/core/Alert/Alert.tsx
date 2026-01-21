'use client';

import React from 'react';

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
  /** Icon slot - renders before content */
  icon?: React.ReactNode;
  /** Close icon slot - renders for close button */
  closeIcon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-surface-primary border-edge-primary text-content-primary',
  success: 'bg-status-success/10 border-status-success text-content-primary',
  warning: 'bg-status-warning/10 border-status-warning text-content-primary',
  error: 'bg-status-error/10 border-status-error text-content-primary',
  info: 'bg-status-info/10 border-status-info text-content-primary',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Alert component - Static alert banners
 *
 * Uses slot-based API for icons to avoid coupling to specific icon systems.
 * Pass your own icon components via the `icon` and `closeIcon` props.
 */
export function Alert({
  variant = 'default',
  title,
  children,
  closable = false,
  onClose,
  icon,
  closeIcon,
  className = '',
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`
        p-4
        border-2
        rounded-sm
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      <div className="flex items-start gap-3">
        {/* Icon slot */}
        {icon && (
          <span className="flex-shrink-0 mt-0.5">
            {icon}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-joystix text-xs uppercase mb-1">
              {title}
            </p>
          )}
          <div className="font-mondwest text-base text-content-primary/80">
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
            {closeIcon || (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
