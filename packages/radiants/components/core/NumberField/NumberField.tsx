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
  /** Whether the field is read-only */
  readOnly?: boolean;
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
  `font-sans bg-page text-main
   placeholder:text-mute text-center
   focus:bg-card
   focus-visible:outline-none
   disabled:opacity-50 disabled:cursor-not-allowed
   h-8 px-2 text-sm w-full min-w-0`
);

const stepButtonVariants = cva(
  `flex items-center justify-center
   bg-accent border-line
   text-accent-inv font-sans text-sm
   hover:bg-inv hover:text-flip
   focus-visible:outline-none
   disabled:opacity-50 disabled:cursor-not-allowed
   h-8 w-8 shrink-0 cursor-pointer select-none`
);

function StepGlyph({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center text-[12px] leading-none"
      style={{ fontFamily: 'var(--font-pixel-code)' }}
    >
      {children}
    </span>
  );
}

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
  readOnly,
  name,
}: RootProps): React.ReactNode {
  return (
    <BaseNumberField.Root
      data-rdna="numberfield"
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      name={name}
      className={className}
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
      className={stepButtonVariants({ className: `border-l ${className}`.trim() })}
    >
      {children ?? <StepGlyph>+</StepGlyph>}
    </BaseNumberField.Increment>
  );
}

/**
 * Decrement button — decreases value by step.
 */
function Decrement({ children, className = '' }: DecrementProps): React.ReactNode {
  return (
    <BaseNumberField.Decrement
      className={stepButtonVariants({ className: `border-r ${className}`.trim() })}
    >
      {children ?? <StepGlyph>-</StepGlyph>}
    </BaseNumberField.Decrement>
  );
}

/**
 * Groups the decrement, input, and increment into a single visual unit.
 */
function Group({ children, className = '' }: GroupProps): React.ReactNode {
  return (
    <BaseNumberField.Group className={`pixel-rounded-4 flex items-center ${className}`.trim()}>
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
    <BaseNumberField.ScrubAreaCursor className={className}>
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
