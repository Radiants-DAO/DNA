'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Slider — Horizontal track with thumb
//
// Distinct from core Slider (which wraps Base UI). This is a standalone
// control-surface primitive using useDragControl.
// =============================================================================

const widthMap: Record<ControlSize, string> = {
  sm: 'min-w-[4rem]',
  md: 'min-w-[8rem]',
  lg: 'min-w-[12rem]',
};

const sliderVariants = cva(
  'inline-flex flex-col gap-1 select-none',
  {
    variants: {
      size: widthMap,
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
);

export function CtrlSlider({
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
    axis: 'x',
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
      data-rdna="ctrl-slider"
      className={sliderVariants({ size, disabled, className })}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-ctrl-value text-[0.625rem] tabular-nums">
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div
        {...bind}
        className={[
          'relative h-2 w-full rounded-full bg-ctrl-track',
          'cursor-grab outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Fill from left */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-ctrl-fill transition-[width] duration-75"
          style={{ width: `${norm * 100}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-2 rounded-sm bg-ctrl-thumb border border-ctrl-fill"
          style={{ left: `${norm * 100}%` }}
        />
      </div>
    </div>
  );
}
