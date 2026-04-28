'use client';

import { useId } from 'react';
import { cva } from 'class-variance-authority';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { SwitchProps, SwitchSize } from './Switch.meta';


// ============================================================================
// Types (re-exported from ./Switch.meta)
// ============================================================================

export type { SwitchProps, SwitchSize };

// ============================================================================
// CVA Variants
// ============================================================================

export const switchTrackVariants = cva(
  'group relative flex items-center cursor-pointer transition-[background-color,border-color] duration-[var(--duration-base)]',
  {
    variants: {
      size: {
        sm: 'w-7 h-3.5',
        md: 'w-8 h-4',
        lg: 'w-10 h-5',
      },
      checked: {
        true: '',
        false: '',
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
    'pointer-events-none relative top-0 transition-[translate,border-color,background-color] duration-[var(--duration-base)]',
    thumbSizeClasses[size],
    checked ? thumbCheckedClasses[size] : 'translate-x-0',
    'shadow-none',
  ].join(' ');

  const labelEl = label ? (
    <label
      htmlFor={switchId}
      className={`font-sans text-base text-main select-none ${disabled ? 'cursor-not-allowed text-mute' : 'cursor-pointer'}`}
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
        className={`pixel-rounded-4 inline-block ${trackClasses}`.trim()}
        data-slot="switch-track"
        data-variant="switch"
        data-checked={checked ? '' : undefined}
        data-size={size}
      >
        <BaseSwitch.Thumb
          data-slot="switch-thumb"
          render={(props) => (
            <div className={`pixel-rounded-4 ${thumbClasses}`.trim()}>
              <span {...props} className="absolute inset-0 switch-thumb" />
            </div>
          )}
        />
      </BaseSwitch.Root>

      {labelPosition === 'right' && labelEl}
    </div>
  );
}
