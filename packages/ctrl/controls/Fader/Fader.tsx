'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// Fader — Vertical track with positioned thumb
//
// Drag vertically to adjust. The thumb slides along a vertical groove.
//
// Paper reference: 1px track line, thin horizontal thumb with glow,
// optional perpendicular tick marks.
// =============================================================================

interface FaderProps extends ContinuousControlProps {
  /** Number of evenly spaced tick marks along the track */
  ticks?: number;
}

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
  ticks,
  className = '',
}: FaderProps) {
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
          'relative flex-1 px-2',
          'cursor-grab outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Track line */}
        <div className="relative w-px h-full mx-auto bg-ctrl-track">
          {/* Filled portion from bottom */}
          <div
            className="absolute inset-x-0 bottom-0 bg-ctrl-fill transition-[height] duration-75"
            style={{
              height: `${norm * 100}%`,
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
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    bottom: `${pct}%`,
                    height: 1,
                    width: 6,
                    backgroundColor: 'var(--color-ctrl-grid-line)',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 bg-ctrl-thumb"
          style={{
            bottom: `${norm * 100}%`,
            height: 2,
            width: 14,
            boxShadow: '0 0 6px var(--color-ctrl-glow)',
          }}
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
