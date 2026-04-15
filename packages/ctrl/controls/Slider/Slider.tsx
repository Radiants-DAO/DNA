'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Slider — Horizontal track with thumb
//
// Distinct from core Slider (which wraps Base UI). This is a standalone
// control-surface primitive using useDragControl.
//
// Paper reference: 1px track line, thin vertical thumb with glow,
// optional perpendicular tick marks.
// =============================================================================

interface SliderProps extends ContinuousControlProps {
  /** Number of evenly spaced tick marks along the track */
  ticks?: number;
}

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
  ticks,
  className = '',
}: SliderProps) {
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
            <span
              className="font-mono text-ctrl-text-active text-[0.625rem] tabular-nums"
              style={{ textShadow: '0 0 8px var(--color-ctrl-glow)' }}
            >
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div
        {...bind}
        className={[
          'relative w-full py-2',
          'cursor-grab outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Track line */}
        <div className="relative h-px w-full bg-ctrl-track">
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 bg-ctrl-fill transition-[width] duration-75"
            style={{
              width: `${norm * 100}%`,
              boxShadow: '0 0 4px var(--color-ctrl-glow)',
            }}
          />
        </div>

        {/* Tick marks */}
        {ticks != null && ticks > 1 && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {Array.from({ length: ticks }, (_, i) => {
              const pct = (i / (ticks - 1)) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    left: `${pct}%`,
                    width: 1,
                    height: 6,
                    backgroundColor: 'var(--color-ctrl-grid-line)',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-ctrl-thumb"
          style={{
            left: `${norm * 100}%`,
            width: 2,
            height: 14,
            boxShadow: '0 0 6px var(--color-ctrl-glow)',
          }}
        />
      </div>
    </div>
  );
}
