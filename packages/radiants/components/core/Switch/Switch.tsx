'use client';

import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Switch as BaseSwitch } from '@base-ui/react/switch';

// ============================================================================
// Types
// ============================================================================

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  /** Form field name for submission */
  name?: string;
  /** Whether the switch is required for form validation */
  required?: boolean;
  /** Whether the switch is read-only */
  readOnly?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const switchTrackVariants = cva(
  'group relative inline-flex items-center rounded-xs border cursor-pointer transition-[background-color,border-color] duration-150',
  {
    variants: {
      size: {
        sm: 'w-7 h-3.5',
        md: 'w-8 h-4',
        lg: 'w-10 h-5',
      },
      checked: {
        true: 'bg-accent border-accent',
        false: 'bg-inv border-line',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      checked: false,
      disabled: false,
    },
  }
);

// ============================================================================
// Thumb helpers
// ============================================================================

const thumbSizeClasses: Record<SwitchSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const thumbCheckedClasses: Record<SwitchSize, string> = {
  sm: 'translate-x-3.5',
  md: 'translate-x-4',
  lg: 'translate-x-5',
};

// ============================================================================
// Component — Base UI Switch.Root/Thumb internals
//
// Sun Mode:  Thumb lifts above the track with a pixel-art drop shadow on hover.
// Moon Mode: Thumb stays flat. Gains ambient glow + yellow border on hover.
//            Dark.css handles Moon Mode overrides via [data-variant="switch"].
// ============================================================================

export function Switch({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  name,
  required,
  readOnly,
  label,
  labelPosition = 'right',
  className = '',
  id,
}: SwitchProps) {
  const reactId = useId();
  const switchId = id || reactId;

  const trackClasses = switchTrackVariants({
    size,
    checked,
    disabled,
  });

  const thumbClasses = [
    'switch-thumb rounded-xs border pointer-events-none relative top-0 transition-[translate,border-color,background-color] duration-150 -m-px',
    thumbSizeClasses[size],
    checked ? thumbCheckedClasses[size] : 'translate-x-0',
    'shadow-none',
    'group-hover:-top-1 group-hover:shadow-lifted',
    'group-active:-top-0.5 group-active:shadow-resting',
  ].join(' ');

  const labelEl = label ? (
    <label
      htmlFor={switchId}
      className={`font-sans text-base text-main select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </label>
  ) : null;

  return (
    <div data-rdna="switch" className={`inline-flex items-center gap-2 ${className}`}>
      {labelPosition === 'left' && labelEl}

      <BaseSwitch.Root
        checked={checked}
        onCheckedChange={(newChecked) => onChange(newChecked)}
        disabled={disabled}
        name={name}
        required={required}
        readOnly={readOnly}
        id={switchId}
        className={trackClasses}
        data-slot="switch-track"
        data-variant="switch"
        data-size={size}
      >
        <BaseSwitch.Thumb className={thumbClasses} data-slot="switch-thumb" />
      </BaseSwitch.Root>

      {labelPosition === 'right' && labelEl}
    </div>
  );
}

export default Switch;
