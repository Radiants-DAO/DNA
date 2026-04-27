'use client';

import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// SegmentedControl — Horizontal tab bar with border-driven active state
//
// Paper ref: 03 — Segment Picker
// Active: gold text + glow + border-bottom. Equal-width segments. Inactive: cream 50%.
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
  /** Border treatment. `flush` is for 1px-gap cell groups inside rails. */
  chrome?: 'bordered' | 'flush';
  /** Stretch both the wrapper and radio group to fill the available width. */
  stretch?: boolean;
  className?: string;
}

const sizeVariants = cva(
  'font-mono uppercase tracking-wider',
  {
    variants: {
      size: {
        sm: 'text-[0.5625rem] px-1.5 min-h-5',
        md: 'text-[0.625rem] px-2 min-h-[--ctrl-row-height]',
        lg: 'px-3 min-h-7',
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
  chrome = 'bordered',
  stretch = false,
  className = '',
}: SegmentedControlProps) {
  const isFlush = chrome === 'flush';

  return (
    <div
      data-rdna="ctrl-segmented"
      data-chrome={chrome}
      className={[
        'inline-flex flex-col gap-1 select-none',
        stretch && 'w-full',
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
        className={[
          'inline-flex gap-px',
          isFlush && 'bg-ink',
          stretch && 'w-full',
        ].filter(Boolean).join(' ')}
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
                'group relative flex items-center justify-center gap-1 transition-colors duration-fast outline-none',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
                isFlush ? 'border-0' : 'border border-ctrl-border-inactive',
                'flex-1',
                isActive
                  ? 'bg-ink text-flip'
                  : 'bg-ctrl-cell-bg text-main',
              ].filter(Boolean).join(' ')}
            >
              {!isActive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 hidden group-hover:block"
                  style={{
                    backgroundColor: 'var(--color-ctrl-label)',
                    WebkitMaskImage: 'var(--pat-diagonal)',
                    maskImage: 'var(--pat-diagonal)',
                    WebkitMaskSize: '8px 8px',
                    maskSize: '8px 8px',
                    WebkitMaskRepeat: 'repeat',
                    maskRepeat: 'repeat',
                  }}
                />
              )}
              <span className="relative inline-flex items-center gap-1">
                {opt.icon}
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
