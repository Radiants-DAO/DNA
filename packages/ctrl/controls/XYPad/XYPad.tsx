'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ControlSize, Point2D, XYPadProps } from '../../primitives/types';

// =============================================================================
// XYPad — 2D control surface with dot-grid background
//
// Drag anywhere to set X/Y position. CSS dot-grid background for visual reference.
// =============================================================================

const dimMap: Record<ControlSize, string> = {
  sm: 'size-[4rem]',
  md: 'size-[6rem]',
  lg: 'size-[8rem]',
};

const padVariants = cva(
  'inline-flex flex-col items-center gap-1 select-none',
  {
    variants: {
      size: dimMap,
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
);

export function XYPad({
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
}: XYPadProps) {
  const { bind, normalizedValue, isDragging } = useDragControl({
    axis: '2d',
    min,
    max,
    step,
    value,
    onChange,
    disabled,
  });

  const norm = normalizedValue as Point2D;
  const displayValue = formatValue
    ? formatValue(value)
    : `${Math.round(value.x)}, ${Math.round(value.y)}`;

  return (
    <div
      data-rdna="ctrl-xypad"
      className={padVariants({ disabled, className })}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        {...bind}
        className={[
          dimMap[size],
          'relative rounded-sm bg-ctrl-cell-bg border border-ctrl-border-inactive',
          'cursor-crosshair outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-ctrl-grid-dot) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {/* Crosshair lines */}
        <div
          className="absolute top-0 bottom-0 w-px bg-ctrl-fill pointer-events-none"
          style={{ left: `${norm.x * 100}%` }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-ctrl-fill pointer-events-none"
          style={{ bottom: `${norm.y * 100}%` }}
        />

        {/* Position dot */}
        <div
          className="absolute size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-ctrl-fill pointer-events-none"
          style={{ left: `${norm.x * 100}%`, bottom: `${norm.y * 100}%`, boxShadow: '0 0 6px var(--color-ctrl-glow)' }}
        />
      </div>

      {showValue && (
        <span
          className="font-mono text-ctrl-text-active text-[0.625rem] tabular-nums"
          style={{ textShadow: '0 0 8px var(--color-ctrl-glow)' }}
        >
          {displayValue}
        </span>
      )}
    </div>
  );
}
