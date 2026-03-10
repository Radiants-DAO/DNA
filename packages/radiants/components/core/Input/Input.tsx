'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size preset */
  size?: InputSize;
  /** @deprecated Pass className="border-status-error" instead */
  error?: boolean;
  /** @deprecated Pass className="w-full" instead */
  fullWidth?: boolean;
  /** @deprecated Use icon prop instead */
  iconName?: string;
  /** Icon slot - render your icon component here (displays on the left) */
  icon?: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** @deprecated Pass className="border-status-error" instead */
  error?: boolean;
  /** @deprecated Pass className="w-full" instead */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const inputVariants = cva(
  `font-sans bg-surface-primary text-content-primary border border-edge-primary rounded-xs
   placeholder:text-content-muted
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0
   disabled:opacity-50 disabled:cursor-not-allowed`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      error: {
        true: 'border-status-error focus-visible:ring-status-error',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
      fullWidth: false,
    },
  }
);

// ============================================================================
// Components
// ============================================================================

/**
 * Text input with semantic token styling
 */
export function Input({
  ref,
  size = 'md',
  error = false,
  fullWidth = false,
  iconName,
  icon,
  className = '',
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const hasIcon = Boolean(icon || iconName);
  const paddingLeft = hasIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';

  const classes = inputVariants({
    size,
    error,
    fullWidth,
    className: `${paddingLeft} ${className}`.trim(),
  });

  const input = (
    <input ref={ref} className={classes} data-size={size} {...props} />
  );

  if (hasIcon) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-muted">
          {icon || (
            <div
              data-icon-slot={iconName}
              style={{
                width: size === 'sm' ? 14 : size === 'lg' ? 18 : 20,
                height: size === 'sm' ? 14 : size === 'lg' ? 18 : 20,
              }}
            />
          )}
        </div>
        {input}
      </div>
    );
  }

  return input;
}

/**
 * Textarea with semantic token styling
 */
export function TextArea({
  ref,
  error = false,
  fullWidth = false,
  className = '',
  ...props
}: TextAreaProps & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const classes = inputVariants({
    size: 'md',
    error,
    fullWidth,
    className: `px-3 py-2 text-base resize-y min-h-24 h-auto ${className}`.trim(),
  });

  return (
    <textarea ref={ref} className={classes} data-size="md" {...props} />
  );
}

/**
 * Form label with optional required indicator
 */
export function Label({ children, required, className = '', ...props }: LabelProps) {
  return (
    <label
      className={className}
      {...props}
    >
      {children}
      {required && <span className="text-status-error ml-1">*</span>}
    </label>
  );
}

export default Input;
