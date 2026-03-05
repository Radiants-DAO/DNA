'use client';

import React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Radio as BaseRadio } from '@base-ui/react/radio';

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
// Checkbox Component — Base UI internals
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
        checked={checked}
        onCheckedChange={(newChecked) => {
          if (onChange) {
            // Synthesize a change event to match the existing onChange(e) API
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
        className={`
          relative w-5 h-5
          border border-edge-primary
          rounded-xs
          flex items-center justify-center
          transition-colors
          focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
          ${checked
            ? 'bg-action-primary'
            : 'bg-surface-primary bg-surface-elevated'
          }
        `}
        {...(props.id ? { id: props.id } : {})}
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
// Radio Component — Base UI internals
// ============================================================================

/**
 * Retro-styled radio button.
 * Uses Base UI Radio.Root/Indicator internally for accessibility and keyboard behavior.
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
  ...props
}: RadioProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <BaseRadio.Root
        value={value as string}
        disabled={disabled}
        inputRef={ref}
        className={`
          relative w-5 h-5
          border border-edge-primary
          rounded-full
          flex items-center justify-center
          transition-colors
          focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1
          ${checked
            ? 'bg-action-primary'
            : 'bg-surface-primary bg-surface-elevated'
          }
        `}
        {...(props.id ? { id: props.id } : {})}
      >
        <BaseRadio.Indicator
          className="flex items-center justify-center"
          keepMounted={false}
        >
          <div className="w-2 h-2 bg-content-primary rounded-full" />
        </BaseRadio.Indicator>
      </BaseRadio.Root>
      {/* Hidden native input for form submission and checked state management */}
      <input
        type="radio"
        ref={ref}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
        {...(props.id ? { id: props.id } : {})}
      />
      {label && (
        <span className="font-sans text-base text-content-primary select-none">
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
