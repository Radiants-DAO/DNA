'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// Fader — Vertical track with positioned thumb
//
// Drag vertically to adjust. The thumb slides along a vertical groove.
// =============================================================================

const heightMap: Record<ControlSize, string> = {
  sm: 'h-[4rem]',
  md: 'h-[6rem]',
  lg: 'h-[8rem]',
};

const faderVariants = cva(
  'inline-flex flex-col items-center gap-1 select-none',
  {
    variants: {
      size: heightMap,
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
);

export function Fader({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0,
  label,
  disabled = false,
  size = 'md',
  showValue = false,
  formatValue,
  className = '',
}: ContinuousControlProps) {
  const { bind, normalizedValue, isDragging } = useDragControl({
    axis: 'y',
    min,
    max,
    step,
    value,
    onChange,
    disabled,
  });

  const norm = normalizedValue as number;
  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  return (
    <div
      data-rdna="ctrl-fader"
      className={faderVariants({ size, disabled, className })}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        {...bind}
        className={[
          'relative w-2 flex-1 rounded-full bg-ctrl-cell-bg',
          'cursor-grab outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Fill from bottom */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-full bg-ctrl-fill transition-[height] duration-75"
          style={{ height: `${norm * 100}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-2 rounded-sm bg-ctrl-thumb border border-ctrl-border-active"
          style={{ bottom: `${norm * 100}%`, top: 'auto', position: 'absolute' }}
        />
      </div>

      {showValue && (
        <span
          className="font-mono text-ctrl-text-active text-[0.625rem] tabular-nums"
          style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
        >
          {displayValue}
        </span>
      )}
    </div>
  );
}
