'use client';

import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ButtonStrip — Cell-based preset bar, radio or multi-select
//
// Paper ref: 06 — Preset Bar
// 1px gap cells, dark bg. Active = gold text + glow. Optional leading label.
// =============================================================================

interface ButtonStripOption {
  value: string;
  label?: string;
  icon?: ReactNode;
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
  'flex items-center justify-center font-mono outline-none transition-all duration-fast bg-ctrl-cell-bg',
  {
    variants: {
      size: {
        sm: 'min-w-5 min-h-5 px-1 text-[0.5625rem]',
        md: 'min-w-6 min-h-[--ctrl-row-height] px-1.5 text-[0.625rem]',
        lg: 'min-w-7 min-h-7 px-2 text-xs',
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
        className="inline-flex gap-[--ctrl-cell-gap] border border-ctrl-border-inactive"
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
                'uppercase tracking-wider',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
                isActive
                  ? 'text-ctrl-text-active'
                  : 'text-ctrl-label hover:text-ctrl-value',
              ].filter(Boolean).join(' ')}
              style={isActive ? { textShadow: '0 0 8px var(--glow-sun-yellow)' } : undefined}
            >
              {opt.icon ?? opt.label ?? opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
