'use client';

import React, { createContext, useContext } from 'react';
import { cva } from 'class-variance-authority';
import { Field as BaseField, type FieldValidity } from '@base-ui/react/field';
import type { InputShellProps, TextAreaShellProps } from './Input.types';


// ============================================================================
// Types
// ============================================================================

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputShellProps {
  /** Icon slot - render your icon component here (displays on the left) */
  icon?: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    TextAreaShellProps {
  /** Additional classes */
  className?: string;
}

interface InputRootProps {
  children: React.ReactNode;
  className?: string;
  /** Field name for native form data */
  name?: string;
  /** Custom validation function */
  validate?: (value: unknown) => string | string[] | null;
  /** When to trigger validation */
  validationMode?: 'onBlur' | 'onChange';
  /** Debounce time for validation in ms */
  validationDebounceTime?: number;
  /** Whether the field is invalid */
  invalid?: boolean;
  /** Whether the field value has been modified */
  dirty?: boolean;
  /** Whether the field has been interacted with */
  touched?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

interface InputLabelProps {
  children: React.ReactNode;
  className?: string;
  /** Shows a red asterisk after the label */
  required?: boolean;
}

interface InputDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface InputErrorProps {
  children: React.ReactNode;
  className?: string;
  /** Match a specific validity key, or pass `true` to always show. */
  match?: boolean | keyof ValidityState;
}

interface InputValidityProps {
  children: (state: FieldValidity.State) => React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

interface InputRootContextValue {
  /** Whether this input is inside an Input.Root */
  inRoot: true;
}

const InputRootContext = createContext<InputRootContextValue | null>(null);

function useInputRootContext() {
  return useContext(InputRootContext);
}

// ============================================================================
// CVA Variants
// ============================================================================

export const inputVariants = cva(
  `font-sans bg-transparent text-main
   placeholder:text-mute
   focus-visible:outline-none`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      error: {
        true: '',
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

const INPUT_BACKGROUND =
  'bg-page focus-within:bg-card';

const INPUT_DISABLED_WRAPPER =
  'has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed';

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Root wrapper that connects label, input, description, and error message.
 * Uses Base UI Field.Root for accessible form field binding.
 */
function InputRoot({
  children,
  className = '',
  name,
  validate,
  validationMode,
  validationDebounceTime,
  invalid,
  dirty,
  touched,
  disabled,
}: InputRootProps): React.ReactNode {
  return (
    <InputRootContext.Provider value={{ inRoot: true }}>
      <BaseField.Root
        data-rdna="input-field"
        name={name}
        validate={validate}
        validationMode={validationMode}
        validationDebounceTime={validationDebounceTime}
        invalid={invalid}
        dirty={dirty}
        touched={touched}
        disabled={disabled}
        className={`flex flex-col gap-1 ${className}`.trim()}
      >
        {children}
      </BaseField.Root>
    </InputRootContext.Provider>
  );
}

/**
 * Label for the input field. Auto-wires to the control via Base UI.
 */
function InputLabel({ children, className = '', required }: InputLabelProps): React.ReactNode {
  return (
    <BaseField.Label
      className={`text-main font-sans text-sm ${className}`.trim()}
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </BaseField.Label>
  );
}

/**
 * Help text displayed below the control.
 */
function InputDescription({ children, className = '' }: InputDescriptionProps): React.ReactNode {
  return (
    <BaseField.Description
      className={`text-mute ${className}`.trim()}
    >
      {children}
    </BaseField.Description>
  );
}

/**
 * Error message displayed when the field is invalid.
 */
function InputError({ children, className = '', match }: InputErrorProps): React.ReactNode {
  return (
    <BaseField.Error
      match={match}
      className={`text-danger ${className}`.trim()}
    >
      {children}
    </BaseField.Error>
  );
}

/**
 * Render prop component that exposes the field's validity state.
 */
function InputValidity({ children }: InputValidityProps): React.ReactNode {
  return (
    <BaseField.Validity>
      {children}
    </BaseField.Validity>
  );
}

// ============================================================================
// Main Components
// ============================================================================

/**
 * Text input with semantic token styling.
 * Works standalone or as part of Input.Root compound component.
 */
function InputControl({
  ref,
  size = 'md',
  error = false,
  fullWidth = false,
  icon,
  className = '',
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const rootCtx = useInputRootContext();
  const hasIcon = Boolean(icon);
  const paddingLeft = hasIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';

  const classes = inputVariants({
    size,
    error,
    fullWidth,
    className: `${paddingLeft} ${className}`.trim(),
  });

  // In standalone mode, error prop colors the shell border.
  // Inside Root, the Root's invalid + Input.Error handles error display.
  const showStandaloneError = error && !rootCtx;

  const inputWithRef = rootCtx ? (
    <BaseField.Control
      ref={ref}
      render={<input data-rdna="input" className={classes} data-size={size} {...props} />}
    />
  ) : (
    <input ref={ref} data-rdna="input" className={classes} data-size={size} {...props} />
  );

  const wrappedInput = (
    <div className={`pixel-rounded-4 ${INPUT_BACKGROUND} ${fullWidth ? 'w-full' : ''} ${INPUT_DISABLED_WRAPPER} ${showStandaloneError ? 'pixel-border-danger' : ''}`.trim()}>
      {inputWithRef}
    </div>
  );

  if (hasIcon) {
    return (
      <div className={fullWidth ? 'relative w-full' : 'relative'}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-mute z-10">
          {icon}
        </div>
        {wrappedInput}
      </div>
    );
  }

  return wrappedInput;
}

/**
 * Textarea with semantic token styling.
 * Works standalone or as part of Input.Root compound component.
 */
export function TextArea({
  ref,
  error = false,
  fullWidth = false,
  className = '',
  ...props
}: TextAreaProps & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const rootCtx = useInputRootContext();
  const showStandaloneError = error && !rootCtx;

  const classes = inputVariants({
    size: 'md',
    error,
    fullWidth,
    className: `w-full px-3 py-2 text-base resize-y min-h-24 h-auto ${className}`.trim(),
  });

  const textareaEl = rootCtx ? (
    <BaseField.Control
      ref={ref as React.Ref<HTMLElement>}
      render={<textarea className={classes} data-size="md" {...props} />}
    />
  ) : (
    <textarea ref={ref} className={classes} data-size="md" {...props} />
  );

  return (
    <div className={`pixel-rounded-4 ${INPUT_BACKGROUND} ${fullWidth ? 'w-full' : ''} ${INPUT_DISABLED_WRAPPER} ${showStandaloneError ? 'pixel-border-danger' : ''}`.trim()}>
      {textareaEl}
    </div>
  );
}

// ============================================================================
// Compound Export
// ============================================================================

/**
 * Input compound component.
 *
 * Standalone: `<Input placeholder="Search..." />`
 * Compound:
 * ```
 * <Input.Root>
 *   <Input.Label required>Email</Input.Label>
 *   <Input type="email" placeholder="you@example.com" />
 *   <Input.Description>We'll never share your email.</Input.Description>
 *   <Input.Error>Enter a valid email.</Input.Error>
 * </Input.Root>
 * ```
 */
export const Input = Object.assign(InputControl, {
  Root: InputRoot,
  Label: InputLabel,
  Description: InputDescription,
  Error: InputError,
  Validity: InputValidity,
}) as typeof InputControl & {
  Root: typeof InputRoot;
  Label: typeof InputLabel;
  Description: typeof InputDescription;
  Error: typeof InputError;
  Validity: typeof InputValidity;
};
