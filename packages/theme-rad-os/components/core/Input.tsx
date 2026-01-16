import React, { forwardRef, useState, useMemo } from 'react';
import { Icon, ICON_SIZES } from './Icon';

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
  /** Icon name (filename without .svg extension) - displays on the left */
  iconName?: string;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  font-mondwest
  bg-surface-primary text-content-primary
  border border-edge-primary
  rounded-sm
  placeholder:text-content-primary/40
  focus:outline-none
  focus:bg-surface-elevated
  disabled:opacity-50 disabled:cursor-not-allowed
`;

// Motion-aware styles using CSS custom properties
// Focus ring uses tokens: --focus-ring-width, --focus-ring-offset, --focus-ring-color
// Transitions respect duration-scalar (instant in light mode, animated in dark mode)
const motionStyles: React.CSSProperties = {
  minHeight: 'var(--touch-target-default)',
  transition: 'background-color var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
};

// Focus ring styles using tokens
const focusRingStyle: React.CSSProperties = {
  outline: 'var(--focus-ring-width) solid var(--focus-ring-color)',
  outlineOffset: 'var(--focus-ring-offset)',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3 text-base',
  lg: 'h-12 px-4 text-base',
};

const errorStyles = `
  border-edge-error
`;

// Error state focus ring (uses destructive color instead of default focus color)
const errorFocusRingStyle: React.CSSProperties = {
  outline: 'var(--focus-ring-width) solid var(--color-destructive)',
  outlineOffset: 'var(--focus-ring-offset)',
};

// ============================================================================
// Components
// ============================================================================

/**
 * Text input with retro styling
 *
 * Features:
 * - Touch targets via min-height: var(--touch-target-default)
 * - Focus ring using tokens: --focus-ring-width, --focus-ring-offset, --focus-ring-color
 * - Motion tokens for transitions (respects duration-scalar)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ size = 'md', error = false, fullWidth = false, iconName, className = '', onFocus, onBlur, ...props }, ref) {
  const [isFocused, setIsFocused] = useState(false);

  const iconSize = size === 'sm' ? ICON_SIZES.sm : size === 'lg' ? ICON_SIZES.lg : ICON_SIZES.md;
  const paddingLeft = iconName ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';

  // If className includes h-full, remove h-* from sizeStyles to allow h-full to take precedence
  const hasFullHeight = className.includes('h-full');
  const sizeClass = hasFullHeight ? sizeStyles[size].replace(/h-\d+/g, '').trim() : sizeStyles[size];

  const classes = [baseStyles, sizeClass, error ? errorStyles : '', fullWidth ? 'w-full' : '', paddingLeft, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Compute dynamic styles with focus ring
  const dynamicStyles = useMemo((): React.CSSProperties => {
    const baseMotion = { ...motionStyles };

    if (isFocused) {
      return {
        ...baseMotion,
        ...(error ? errorFocusRingStyle : focusRingStyle),
      };
    }

    return baseMotion;
  }, [isFocused, error]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const input = (
    <input
      ref={ref}
      className={classes}
      style={dynamicStyles}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );

  if (iconName) {
    return (
      <div className="relative h-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon name={iconName} size={iconSize} className="text-content-primary/40" />
        </div>
        {input}
      </div>
    );
  }

  return input;
});

/**
 * Textarea with retro styling
 *
 * Features:
 * - Focus ring using tokens: --focus-ring-width, --focus-ring-offset, --focus-ring-color
 * - Motion tokens for transitions (respects duration-scalar)
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ error = false, fullWidth = false, iconName, className = '', onFocus, onBlur, ...props }, ref) {
  const [isFocused, setIsFocused] = useState(false);

  const paddingLeft = iconName ? 'pl-10' : '';

  const classes = [baseStyles, 'px-3 py-2 text-base', 'resize-y min-h-24', error ? errorStyles : '', fullWidth ? 'w-full' : '', paddingLeft, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Compute dynamic styles with focus ring (no touch target min-height for textarea)
  const dynamicStyles = useMemo((): React.CSSProperties => {
    const baseMotion: React.CSSProperties = {
      transition: 'background-color var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
    };

    if (isFocused) {
      return {
        ...baseMotion,
        ...(error ? errorFocusRingStyle : focusRingStyle),
      };
    }

    return baseMotion;
  }, [isFocused, error]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const textarea = (
    <textarea
      ref={ref}
      className={classes}
      style={dynamicStyles}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );

  if (iconName) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-3 pointer-events-none">
          <Icon name={iconName} size={ICON_SIZES.md} className="text-content-primary/40" />
        </div>
        {textarea}
      </div>
    );
  }

  return textarea;
});

// ============================================================================
// Label Component
// ============================================================================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

/**
 * Form label
 */
export function Label({ children, required, className = '', ...props }: LabelProps) {
  return (
    <label className={className} {...props}>
      {children}
      {required && <span className="text-content-error ml-1">*</span>}
    </label>
  );
}

export default Input;
export type { InputSize, InputProps, TextAreaProps, LabelProps };
