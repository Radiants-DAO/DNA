'use client';

import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// Stepper — Decrement button | editable value | Increment button
// =============================================================================

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  formatValue?: (v: number) => string;
  className?: string;
}

const buttonVariants = cva(
  'flex items-center justify-center font-mono outline-none transition-colors duration-fast',
  {
    variants: {
      size: {
        sm: 'size-5 text-xs',
        md: 'size-6 text-sm',
        lg: 'size-7 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled = false,
  size = 'md',
  formatValue,
  className = '',
}: StepperProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      data-rdna="ctrl-stepper"
      className={[
        'inline-flex flex-col gap-1 select-none',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="inline-flex items-center rounded-sm bg-ctrl-track overflow-hidden">
        <button
          type="button"
          disabled={disabled || atMin}
          onClick={() => onChange(clamp(value - step, min, max))}
          aria-label="Decrease"
          className={[
            buttonVariants({ size }),
            'text-ctrl-label hover:bg-ctrl-hover/20 hover:text-ctrl-value',
            'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
            atMin && 'opacity-30 pointer-events-none',
          ].filter(Boolean).join(' ')}
        >
          −
        </button>

        <span
          className={[
            'font-mono tabular-nums text-ctrl-value px-2',
            size === 'sm' ? 'text-[0.625rem]' : size === 'lg' ? 'text-sm' : 'text-xs',
          ].join(' ')}
        >
          {displayValue}
        </span>

        <button
          type="button"
          disabled={disabled || atMax}
          onClick={() => onChange(clamp(value + step, min, max))}
          aria-label="Increase"
          className={[
            buttonVariants({ size }),
            'text-ctrl-label hover:bg-ctrl-hover/20 hover:text-ctrl-value',
            'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
            atMax && 'opacity-30 pointer-events-none',
          ].filter(Boolean).join(' ')}
        >
          +
        </button>
      </div>
    </div>
  );
}
