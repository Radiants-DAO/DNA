'use client';

import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// SegmentedControl — Row of mutually exclusive options with active highlight
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
        sm: 'text-[0.5625rem] px-1.5 py-0.5',
        md: 'text-[0.625rem] px-2 py-1',
        lg: 'text-xs px-3 py-1.5',
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
        className="inline-flex rounded-sm bg-ctrl-track overflow-hidden"
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
                'flex items-center gap-1 transition-colors duration-fast outline-none',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
                isActive
                  ? 'bg-ctrl-fill text-ctrl-active'
                  : 'text-ctrl-label hover:text-ctrl-value',
              ].filter(Boolean).join(' ')}
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
