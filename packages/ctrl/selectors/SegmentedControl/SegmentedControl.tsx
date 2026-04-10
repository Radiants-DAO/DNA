'use client';

import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// SegmentedControl — Horizontal tab bar with border-driven active state
//
// Paper ref: 03 — Segment Picker
// Active: gold text + glow + border-top/sides. Inactive: cream 50%.
// =============================================================================

interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

const sizeVariants = cva(
  'font-mono uppercase tracking-wider',
  {
    variants: {
      size: {
        sm: 'text-[0.5625rem] px-1.5 min-h-5',
        md: 'text-[0.625rem] px-2 min-h-[--ctrl-row-height]',
        lg: 'text-xs px-3 min-h-7',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function SegmentedControl({
  value,
  onChange,
  options,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      data-rdna="ctrl-segmented"
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
        role="radiogroup"
        className="inline-flex gap-[--ctrl-cell-gap]"
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              role="radio"
              type="button"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={[
                sizeVariants({ size }),
                'flex items-center justify-center gap-1 transition-all duration-fast outline-none',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
                'bg-ctrl-cell-bg',
                isActive
                  ? 'text-ctrl-text-active border-t border-l border-r border-ctrl-border-active'
                  : 'text-ctrl-label border-t border-l border-r border-transparent hover:text-ctrl-value',
              ].filter(Boolean).join(' ')}
              style={isActive ? { textShadow: '0 0 8px var(--glow-sun-yellow)' } : undefined}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
