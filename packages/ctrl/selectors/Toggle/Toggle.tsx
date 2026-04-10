'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Toggle — LED lamp/latch indicator
//
// Distinct from core Toggle (which is a button variant wrapping Base UI).
// This is an LED-style on/off indicator with optional label.
// =============================================================================

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  /** LED color token override — defaults to ctrl-fill (accent) */
  color?: string;
  className?: string;
}

const ledSize: Record<ControlSize, string> = {
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
};

const toggleVariants = cva(
  'inline-flex items-center gap-1.5 select-none cursor-pointer outline-none',
  {
    variants: {
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none cursor-default',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
  },
);

export function Toggle({
  value,
  onChange,
  label,
  disabled = false,
  size = 'md',
  color,
  className = '',
}: ToggleProps) {
  return (
    <button
      type="button"
      data-rdna="ctrl-toggle"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        toggleVariants({ disabled }),
        'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* LED indicator */}
      <span
        className={[
          ledSize[size],
          'rounded-full transition-all duration-fast',
          value
            ? 'shadow-[0_0_4px_var(--ctrl-glow)]'
            : 'bg-ctrl-track',
        ].filter(Boolean).join(' ')}
        style={value ? { backgroundColor: color ?? 'var(--ctrl-fill)' } : undefined}
      />

      {label && (
        <span className={[
          'font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-fast',
          value ? 'text-ctrl-value' : 'text-ctrl-label',
        ].join(' ')}>
          {label}
        </span>
      )}
    </button>
  );
}
