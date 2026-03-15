'use client';

import React from 'react';
import { Field as BaseField } from '@base-ui/react/field';

// ============================================================================
// Types
// ============================================================================

interface RootProps {
  children: React.ReactNode;
  className?: string;
  /** Whether the field is invalid */
  invalid?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

interface ControlProps {
  children: React.ReactElement;
  className?: string;
}

interface DescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ErrorProps {
  children: React.ReactNode;
  className?: string;
  /** Match a specific validity key, or pass `true` to always show. */
  match?: boolean | keyof ValidityState;
}

interface ValidityProps {
  children: (state: { validity: Record<string, unknown> }) => React.ReactNode;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Root wrapper that connects label, input, description, and error message.
 * Uses Base UI Field.Root for accessible form field binding.
 */
function Root({ children, className = '', invalid, disabled }: RootProps): React.ReactNode {
  return (
    <BaseField.Root
      data-rdna="field"
      invalid={invalid}
      disabled={disabled}
      className={`flex flex-col gap-1 ${className}`.trim()}
    >
      {children}
    </BaseField.Root>
  );
}

/**
 * Label that auto-connects to the Field control via Base UI.
 */
function Label({ children, className = '' }: LabelProps): React.ReactNode {
  return (
    <BaseField.Label
      className={`text-content-primary font-sans text-sm ${className}`.trim()}
    >
      {children}
    </BaseField.Label>
  );
}

/**
 * Wraps an input element to connect it to the Field's label and description.
 * Renders as the child element (e.g. <input>, <select>, <textarea>).
 */
function Control({ children, className = '' }: ControlProps): React.ReactNode {
  return (
    <BaseField.Control
      className={className || undefined}
      render={children}
    />
  );
}

/**
 * Help text displayed below the control.
 */
function Description({ children, className = '' }: DescriptionProps): React.ReactNode {
  return (
    <BaseField.Description
      className={`text-content-muted text-xs ${className}`.trim()}
    >
      {children}
    </BaseField.Description>
  );
}

/**
 * Error message displayed when the field is invalid.
 */
function Error({ children, className = '', match }: ErrorProps): React.ReactNode {
  return (
    <BaseField.Error
      match={match}
      className={`text-status-error text-xs ${className}`.trim()}
    >
      {children}
    </BaseField.Error>
  );
}

/**
 * Render prop component that exposes the field's validity state.
 */
function Validity({ children }: ValidityProps): React.ReactNode {
  return (
    <BaseField.Validity>
      {children}
    </BaseField.Validity>
  );
}

// ============================================================================
// Export
// ============================================================================

export const Field = {
  Root,
  Label,
  Control,
  Description,
  Error,
  Validity,
};

export default Field;
