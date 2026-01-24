'use client';

import React, { forwardRef } from 'react';

// ============================================================================
// Types
// ============================================================================

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size preset */
  size?: InputSize;
  /** Error state */
  error?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Icon name (filename without .svg extension) - displays on the left */
  iconName?: string;
  /** Additional classes */
  className?: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean;
  /** Full width */
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
// Styles
// ============================================================================

/**
 * Base input styles using semantic tokens
 */
const baseStyles = `
  font-sans
  bg-surface-primary text-content-primary
  border border-edge-primary
  rounded-sm
  placeholder:text-content-muted
  focus:outline-none
  focus:ring-2 focus:ring-edge-focus focus:ring-offset-0
  disabled:opacity-50 disabled:cursor-not-allowed
`;

/**
 * Size presets
 */
const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3 text-base',
  lg: 'h-12 px-4 text-base',
};

/**
 * Error state styles using semantic tokens
 */
const errorStyles = `
  border-status-error
  focus:ring-status-error
`;

// ============================================================================
// Components
// ============================================================================

/**
 * Text input with semantic token styling
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    error = false,
    fullWidth = false,
    iconName,
    className = '',
    ...props
  },
  ref
) {
  const paddingLeft = iconName ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';

  const classes = [
    baseStyles,
    sizeStyles[size],
    error ? errorStyles : '',
    fullWidth ? 'w-full' : '',
    paddingLeft,
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const input = (
    <input ref={ref} className={classes} {...props} />
  );

  if (iconName) {
    return (
      <div className="relative">
        {/* Icon slot placeholder - integrate with Icon component as needed */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="text-content-muted"
            data-icon-slot={iconName}
            style={{
              width: size === 'sm' ? 14 : size === 'lg' ? 18 : 20,
              height: size === 'sm' ? 14 : size === 'lg' ? 18 : 20,
            }}
          />
        </div>
        {input}
      </div>
    );
  }

  return input;
});

/**
 * Textarea with semantic token styling
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    error = false,
    fullWidth = false,
    className = '',
    ...props
  },
  ref
) {
  const classes = [
    baseStyles,
    'px-3 py-2 text-base',
    'resize-y min-h-24',
    error ? errorStyles : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <textarea ref={ref} className={classes} {...props} />
  );
});

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
