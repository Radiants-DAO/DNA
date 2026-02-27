'use client';

import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const switchTrackVariants = cva(
  'group relative inline-flex items-center rounded-xs border border-edge-primary cursor-pointer transition-[background-color] duration-150',
  {
    variants: {
      size: {
        sm: 'w-7 h-3.5',
        md: 'w-8 h-4',
        lg: 'w-10 h-5',
      },
      checked: {
        true: 'bg-action-primary',
        false: 'bg-surface-secondary',
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
// Component
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
    'switch-thumb rounded-xs border border-edge-primary pointer-events-none bg-surface-primary relative top-0 transition-[translate] duration-150 -m-px',
    thumbSizeClasses[size],
    checked ? thumbCheckedClasses[size] : 'translate-x-0',
    'shadow-none',
    'group-hover:-top-1 group-hover:shadow-lifted',
    'group-active:-top-0.5 group-active:shadow-resting',
  ].join(' ');

  const labelEl = label ? (
    <label
      htmlFor={switchId}
      className={`font-sans text-base text-content-primary select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </label>
  ) : null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {labelPosition === 'left' && labelEl}

      <label
        htmlFor={switchId}
        className={trackClasses}
        data-variant="switch"
        data-size={size}
        data-checked={checked}
      >
        {/* Hidden input for accessibility */}
        <input
          type="checkbox"
          id={switchId}
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(!checked)}
          className="absolute opacity-0 w-0 h-0 peer"
        />

        {/* Focus ring */}
        <div className="absolute inset-0 rounded-xs peer-focus-visible:ring-2 peer-focus-visible:ring-edge-focus peer-focus-visible:ring-offset-1 pointer-events-none" />

        {/* Thumb */}
        <div className={thumbClasses} />

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 rounded-xs opacity-50 bg-surface-muted pointer-events-none" />
        )}
      </label>

      {labelPosition === 'right' && labelEl}
    </div>
  );
}

export default Switch;
