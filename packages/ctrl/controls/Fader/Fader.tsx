'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// Fader — Track + thumb control. Vertical (default) or horizontal.
//
// Vertical: drag up/down; thumb slides along vertical groove.
// Horizontal: drag left/right; thumb slides along horizontal groove.
// Paper reference: 1px groove, thin perpendicular thumb with glow, optional
// perpendicular tick marks.
// =============================================================================

type FaderOrientation = 'vertical' | 'horizontal';

interface FaderProps extends ContinuousControlProps {
  /** Number of evenly spaced tick marks along the track */
  ticks?: number;
  /** Fader orientation. Defaults to 'vertical'. */
  orientation?: FaderOrientation;
}

const heightMap: Record<ControlSize, string> = {
  sm: 'h-[4rem]',
  md: 'h-[6rem]',
  lg: 'h-[8rem]',
};

const horizontalWidthMap: Record<ControlSize, string> = {
  sm: 'w-[4rem]',
  md: 'w-[6rem]',
  lg: 'w-[8rem]',
};

const verticalVariants = cva(
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

const horizontalVariants = cva(
  'inline-flex items-center gap-2 select-none',
  {
    variants: {
      size: horizontalWidthMap,
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
  orientation = 'vertical',
  className = '',
}: FaderProps) {
  const { bind, normalizedValue, isDragging } = useDragControl({
    axis: orientation === 'horizontal' ? 'x' : 'y',
    min,
    max,
    step,
    value,
    onChange,
    disabled,
  });

  const norm = normalizedValue as number;
  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  if (orientation === 'horizontal') {
    return (
      <div
        data-rdna="ctrl-fader"
        data-orientation="horizontal"
        className={horizontalVariants({ size, disabled, className })}
      >
        {label && (
          <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
            {label}
          </span>
        )}

        <div
          {...bind}
          className={[
            'relative flex-1 py-2',
            'cursor-grab outline-none',
            'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
            isDragging && 'cursor-grabbing',
          ].filter(Boolean).join(' ')}
        >
          {/* Groove (1px centered) */}
          <div className="relative h-px w-full my-auto bg-ctrl-track">
            <div
              className="absolute inset-y-0 left-0 bg-ctrl-fill transition-[width] duration-75"
              style={{
                width: `${norm * 100}%`,
                boxShadow: '0 0 4px var(--color-ctrl-glow)',
              }}
            />
          </div>

          {/* Tick marks (perpendicular to groove) */}
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

          {/* Thumb (vertical bar) */}
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

  return (
    <div
      data-rdna="ctrl-fader"
      data-orientation="vertical"
      className={verticalVariants({ size, disabled, className })}
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
        <div className="relative w-px h-full mx-auto bg-ctrl-track">
          <div
            className="absolute inset-x-0 bottom-0 bg-ctrl-fill transition-[height] duration-75"
            style={{
              height: `${norm * 100}%`,
              boxShadow: '0 0 4px var(--color-ctrl-glow)',
            }}
          />
        </div>

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
