'use client';

import React, { createContext, use } from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

// ============================================================================
// Types
// ============================================================================

interface CheckboxProps {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
  /** Controlled checked state */
  checked?: boolean;
  /** Uncontrolled initial checked state */
  defaultChecked?: boolean;
  /** Whether the checkbox is in an indeterminate (mixed) state */
  indeterminate?: boolean;
  /** Fires when checked state changes */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  value?: string;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
}

interface RadioProps {
  /** Label text */
  label?: string;
  /** Additional classes for container */
  className?: string;
  /** Controlled checked state (standalone mode) */
  checked?: boolean;
  /** Value for use inside RadioGroup */
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
}

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// RadioGroup context — lets Radio know it's inside a shared group
// ============================================================================

const RadioGroupContext = createContext(false);

// ============================================================================
// Pixel-art Checkmark Icon
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
// Checkbox Component
// ============================================================================

export function Checkbox({
  ref,
  label,
  className = '',
  disabled,
  checked,
  defaultChecked,
  indeterminate,
  onChange,
  onCheckedChange,
  required,
  readOnly,
  name,
  value,
  id,
}: CheckboxProps) {
  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      data-rdna="checkbox"
      data-variant="checkbox"
    >
      <BaseCheckbox.Root
        checked={checked}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        onCheckedChange={(newChecked) => {
          onCheckedChange?.(newChecked);
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
        required={required}
        readOnly={readOnly}
        name={name}
        value={value}
        inputRef={ref}
        id={id}
        render={(props, state) => (
          <span
            {...props}
            className={`
              relative w-5 h-5
              border border-line
              rounded-xs
              flex items-center justify-center
              transition-colors
              focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
              cursor-pointer
              ${state.checked || state.indeterminate
                ? 'bg-accent'
                : 'bg-page bg-card'
              }
            `}
          />
        )}
      >
        <BaseCheckbox.Indicator
          data-slot="indicator"
          className="flex items-center justify-center"
        >
          <CheckmarkIcon className="text-main" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label && (
        <span className="font-sans text-base text-main select-none">
          {label}
        </span>
      )}
    </label>
  );
}

// ============================================================================
// RadioGroup Component
// ============================================================================

export function RadioGroup({
  value,
  onValueChange,
  name,
  disabled,
  required,
  readOnly,
  children,
  className = '',
}: RadioGroupProps) {
  return (
    <RadioGroupContext value={true}>
      <BaseRadioGroup
        value={value}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        className={className}
      >
        {children}
      </BaseRadioGroup>
    </RadioGroupContext>
  );
}

// ============================================================================
// Radio Component
// ============================================================================

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
}: RadioProps) {
  const inGroup = use(RadioGroupContext);
  const radioValue = value ?? '__rdna-radio__';

  const radioRoot = (
    <BaseRadio.Root
      value={radioValue}
      inputRef={ref}
      id={id}
      disabled={disabled}
      render={(props, state) => (
        <span
          {...props}
          className={`
            w-5 h-5
            border border-line
            rounded-full
            flex items-center justify-center
            transition-colors
            focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
            cursor-pointer
            ${state.checked
              ? 'bg-accent'
              : 'bg-page bg-card'
            }
            ${className}
          `}
        />
      )}
    >
      <BaseRadio.Indicator keepMounted className="flex items-center justify-center">
        <div className="w-2 h-2 bg-main rounded-full" />
      </BaseRadio.Indicator>
    </BaseRadio.Root>
  );

  if (inGroup) {
    return (
      <label
        className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {radioRoot}
        {label && (
          <span className="font-sans text-base text-main select-none">
            {label}
          </span>
        )}
      </label>
    );
  }

  // Standalone mode — wrap in own group for backwards compat with checked/onChange API
  const uncheckedValue = '__rdna-radio-unchecked__';
  const isChecked = checked === true;

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        {radioRoot}
      </BaseRadioGroup>
      {label && (
        <span className="font-sans text-base text-main select-none">
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
