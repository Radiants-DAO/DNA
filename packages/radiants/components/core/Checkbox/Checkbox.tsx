'use client';

import React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

// ============================================================================
// Types
// ============================================================================

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
}

// ============================================================================
// Pixel-art Checkmark Icon (matches /assets/icons/checkmark.svg)
// ============================================================================

function CheckmarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fill="currentColor"
        d="M2,8H4V9H5V10H7V9H8V8H9V7H10V6H11V5H12V4H14V6H13V7H12V8H11V9H10V10H9V11H8V12H7V13H5V12H4V11H3V10H2V8Z"
      />
    </svg>
  );
}

// ============================================================================
// Checkbox Component — Base UI Checkbox.Root/Indicator internals
// ============================================================================

/**
 * Retro-styled checkbox with pixel-art checkmark.
 * Uses Base UI Checkbox.Root/Indicator internally for accessibility and keyboard behavior.
 */
export function Checkbox({
  ref,
  label,
  className = '',
  disabled,
  checked,
  onChange,
  name,
  value,
  id,
  ...props
}: CheckboxProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      data-variant="checkbox"
    >
      <BaseCheckbox.Root
        checked={checked as boolean | undefined}
        onCheckedChange={(newChecked) => {
          if (onChange) {
            const syntheticEvent = {
              target: { checked: newChecked, name, value, type: 'checkbox' },
              currentTarget: { checked: newChecked, name, value, type: 'checkbox' },
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        }}
        disabled={disabled}
        name={name}
        value={value as string}
        inputRef={ref}
        id={id}
        {...(props as Record<string, unknown>)}
        className={`
          relative w-5 h-5
          border border-edge-primary
          rounded-xs
          flex items-center justify-center
          transition-colors
          focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
          cursor-pointer
          ${checked
            ? 'bg-action-primary'
            : 'bg-surface-primary bg-surface-elevated'
          }
        `}
      >
        <BaseCheckbox.Indicator
          className="flex items-center justify-center"
          keepMounted={false}
        >
          <CheckmarkIcon className="text-content-primary" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label && (
        <span className="font-sans text-base text-content-primary select-none">
          {label}
        </span>
      )}
    </label>
  );
}

// ============================================================================
// Radio Component
// ============================================================================

/**
 * Retro-styled radio button.
 * Uses Base UI Radio + RadioGroup internals while preserving existing event API.
 */
export function Radio({
  ref,
  label,
  className = '',
  disabled,
  checked,
  onChange,
  name,
  value,
  id,
  required,
  readOnly,
  ...props
}: RadioProps & { ref?: React.Ref<HTMLInputElement> }) {
  // Base UI Radio requires a group context; this wraps the single radio while
  // preserving the existing controlled `checked` + `onChange` contract.
  const radioValue = value ?? '__rdna-radio__';
  const uncheckedValue = '__rdna-radio-unchecked__';
  const isChecked = checked === true;

  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <BaseRadioGroup
        value={isChecked ? radioValue : uncheckedValue}
        onValueChange={() => {
          if (onChange) {
            const syntheticEvent = {
              target: { checked: true, name, value, type: 'radio' },
              currentTarget: { checked: true, name, value, type: 'radio' },
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        }}
        name={name}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
      >
        <BaseRadio.Root
          value={radioValue}
          inputRef={ref}
          id={id}
          disabled={disabled}
          className={`
            w-5 h-5
            border border-edge-primary
            rounded-full
            flex items-center justify-center
            transition-colors
            focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
            cursor-pointer
            ${isChecked
              ? 'bg-action-primary'
              : 'bg-surface-primary bg-surface-elevated'
            }
          `}
          {...(props as Record<string, unknown>)}
        >
          <BaseRadio.Indicator
            className="flex items-center justify-center"
            keepMounted={false}
          >
            <div className="w-2 h-2 bg-content-primary rounded-full" />
          </BaseRadio.Indicator>
        </BaseRadio.Root>
      </BaseRadioGroup>
      {label && (
        <span className="font-sans text-base text-content-primary select-none">
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
