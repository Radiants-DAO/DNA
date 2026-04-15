'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps } from '../../primitives/types';

// =============================================================================
// NumberScrubber — Inline drag-to-adjust numeric display
//
// Drag horizontally to change value. Standalone control (distinct from core
// NumberField.ScrubArea which wraps Base UI).
// =============================================================================

const scrubberVariants = cva(
  'inline-flex items-center gap-1 select-none font-mono tabular-nums',
  {
    variants: {
      size: {
        sm: 'text-[0.625rem]',
        md: 'text-xs',
        lg: 'text-sm',
      },
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
);

export function NumberScrubber({
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
}: ContinuousControlProps) {
  const { bind, isDragging } = useDragControl({
    axis: 'x',
    min,
    max,
    step,
    sensitivity: 2,
    value,
    onChange,
    disabled,
  });

  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  return (
    <div
      data-rdna="ctrl-number-scrubber"
      className={scrubberVariants({ size, disabled, className })}
    >
      {label && (
        <span className="text-ctrl-label uppercase tracking-wider">
          {label}
        </span>
      )}

      <span
        {...bind}
        className={[
          'text-ctrl-text-active cursor-ew-resize outline-none px-1 rounded-sm',
          'hover:bg-ctrl-hover/10',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'bg-ctrl-hover/20',
        ].filter(Boolean).join(' ')}
        style={{ textShadow: '0 0 8px var(--color-ctrl-glow)' }}
      >
        {displayValue}
      </span>
    </div>
  );
}
