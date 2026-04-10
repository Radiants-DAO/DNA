'use client';

import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ChipTag — Selectable pill labels, single or multi-select
// =============================================================================

interface ChipTagProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: string[];
  mode?: 'single' | 'multi';
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

const chipVariants = cva(
  'font-mono uppercase tracking-wider rounded-full outline-none transition-colors duration-fast',
  {
    variants: {
      size: {
        sm: 'text-[0.5rem] px-1.5 py-0.5',
        md: 'text-[0.5625rem] px-2 py-0.5',
        lg: 'text-[0.625rem] px-2.5 py-1',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function ChipTag({
  value,
  onChange,
  options,
  mode = 'single',
  label,
  disabled = false,
  size = 'md',
  className = '',
}: ChipTagProps) {
  const selected = Array.isArray(value) ? value : [value];

  const toggle = (opt: string) => {
    if (mode === 'single') {
      onChange(opt);
    } else {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange(next);
    }
  };

  return (
    <div
      data-rdna="ctrl-chip-tag"
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

      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => toggle(opt)}
              className={[
                chipVariants({ size }),
                'border',
                'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
                isActive
                  ? 'border-ctrl-border-active text-ctrl-text-active bg-ctrl-cell-bg'
                  : 'border-ctrl-border-inactive text-ctrl-label bg-ctrl-cell-bg hover:text-ctrl-value',
              ].filter(Boolean).join(' ')}
              style={isActive ? {
                textShadow: '0 0 8px var(--glow-sun-yellow)',
                boxShadow: '0 0 6px var(--glow-sun-yellow-subtle)',
              } : undefined}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
