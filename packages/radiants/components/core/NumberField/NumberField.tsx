'use client';

import React from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

interface RootProps {
  children: React.ReactNode;
  className?: string;
  /** The default value (uncontrolled) */
  defaultValue?: number;
  /** The controlled value */
  value?: number;
  /** Callback when the value changes */
  onValueChange?: (value: number | null, eventDetails: unknown) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Name for form submission */
  name?: string;
}

interface InputProps {
  className?: string;
  placeholder?: string;
}

interface IncrementProps {
  children?: React.ReactNode;
  className?: string;
}

interface DecrementProps {
  children?: React.ReactNode;
  className?: string;
}

interface GroupProps {
  children: React.ReactNode;
  className?: string;
}

interface ScrubAreaProps {
  children: React.ReactNode;
  className?: string;
  /** Orientation for scrubbing direction */
  direction?: 'horizontal' | 'vertical';
}

interface ScrubAreaCursorProps {
  children?: React.ReactNode;
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const numberInputVariants = cva(
  `font-sans bg-surface-primary text-content-primary border-y border-edge-primary
   placeholder:text-content-muted text-center
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0
   disabled:opacity-50 disabled:cursor-not-allowed
   h-8 px-2 text-sm w-full min-w-0`
);

const stepButtonVariants = cva(
  `flex items-center justify-center
   bg-surface-secondary border border-edge-primary
   text-content-primary font-sans text-sm
   hover:bg-surface-tertiary
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-0
   disabled:opacity-50 disabled:cursor-not-allowed
   h-8 w-8 shrink-0 cursor-pointer select-none`
);

// ============================================================================
// Components
// ============================================================================

/**
 * Root container for the number field.
 * Manages value state and passes config to child components via Base UI context.
 */
function Root({
  children,
  className = '',
  defaultValue,
  value,
  onValueChange,
  min,
  max,
  step,
  disabled,
  required,
  name,
}: RootProps): React.ReactNode {
  return (
    <BaseNumberField.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      required={required}
      name={name}
      className={className || undefined}
    >
      {children}
    </BaseNumberField.Root>
  );
}

/**
 * The numeric input element.
 */
function Input({ className = '', placeholder }: InputProps): React.ReactNode {
  return (
    <BaseNumberField.Input
      className={numberInputVariants({ className })}
      placeholder={placeholder}
    />
  );
}

/**
 * Increment button — increases value by step.
 */
function Increment({ children, className = '' }: IncrementProps): React.ReactNode {
  return (
    <BaseNumberField.Increment
      className={stepButtonVariants({ className: `rounded-r-xs ${className}`.trim() })}
    >
      {children ?? (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </BaseNumberField.Increment>
  );
}

/**
 * Decrement button — decreases value by step.
 */
function Decrement({ children, className = '' }: DecrementProps): React.ReactNode {
  return (
    <BaseNumberField.Decrement
      className={stepButtonVariants({ className: `rounded-l-xs ${className}`.trim() })}
    >
      {children ?? (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </BaseNumberField.Decrement>
  );
}

/**
 * Groups the decrement, input, and increment into a single visual unit.
 */
function Group({ children, className = '' }: GroupProps): React.ReactNode {
  return (
    <BaseNumberField.Group
      className={`flex items-center ${className}`.trim()}
    >
      {children}
    </BaseNumberField.Group>
  );
}

/**
 * Scrub area — allows click-and-drag to adjust value.
 */
function ScrubArea({ children, className = '', direction }: ScrubAreaProps): React.ReactNode {
  return (
    <BaseNumberField.ScrubArea
      direction={direction}
      className={`cursor-ew-resize ${className}`.trim()}
    >
      {children}
    </BaseNumberField.ScrubArea>
  );
}

/**
 * Custom cursor rendered inside the scrub area during scrubbing.
 */
function ScrubAreaCursor({ children, className = '' }: ScrubAreaCursorProps): React.ReactNode {
  return (
    <BaseNumberField.ScrubAreaCursor className={className || undefined}>
      {children}
    </BaseNumberField.ScrubAreaCursor>
  );
}

// ============================================================================
// Export
// ============================================================================

export const NumberField = {
  Root,
  Input,
  Increment,
  Decrement,
  Group,
  ScrubArea,
  ScrubAreaCursor,
};

export default NumberField;
