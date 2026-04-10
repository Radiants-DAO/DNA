'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ButtonStrip — Row of icon/label buttons, radio or multi-select mode
// =============================================================================

interface ButtonStripOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
}

interface ButtonStripProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: ButtonStripOption[];
  mode?: 'radio' | 'multi';
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

const itemVariants = cva(
  'flex items-center justify-center font-mono outline-none transition-colors duration-fast',
  {
    variants: {
      size: {
        sm: 'size-5 text-[0.5625rem]',
        md: 'size-6 text-[0.625rem]',
        lg: 'size-7 text-xs',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function ButtonStrip({
  value,
  onChange,
  options,
  mode = 'radio',
  label,
  disabled = false,
  size = 'md',
  className = '',
}: ButtonStripProps) {
  const selected = Array.isArray(value) ? value : [value];

  const toggle = (optValue: string) => {
    if (mode === 'radio') {
      onChange(optValue);
    } else {
      const next = selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : [...selected, optValue];
      onChange(next);
    }
  };

  return (
    <div
      data-rdna="ctrl-button-strip"
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

      <div
        role={mode === 'radio' ? 'radiogroup' : 'group'}
        className="inline-flex rounded-sm bg-ctrl-track overflow-hidden"
      >
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role={mode === 'radio' ? 'radio' : undefined}
              aria-checked={mode === 'radio' ? isActive : undefined}
              aria-pressed={mode === 'multi' ? isActive : undefined}
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              className={[
                itemVariants({ size }),
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
                isActive
                  ? 'bg-ctrl-fill text-ctrl-active'
                  : 'text-ctrl-label hover:text-ctrl-value hover:bg-ctrl-hover/10',
              ].filter(Boolean).join(' ')}
            >
              {opt.icon ?? opt.label ?? opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
