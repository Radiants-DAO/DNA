'use client';

import { useCallback, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { cva } from 'class-variance-authority';
import { clamp } from '../../primitives/math';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';
import './Slider.css';

// =============================================================================
// ctrl/Slider — Horizontal LCD-style slider
//
// Two visual variants, both driven by the same position-based pointer model
// (click-to-set, drag to scrub). Keyboard stepping + full ARIA slider
// semantics are shared.
//
//   variant="lcd"  (default) — Paper LCD: 1px groove, end caps, 3 middle
//                              tick stubs, 2×14 filament thumb, sun-yellow
//                              + cream triple-glow on fill and thumb.
//   variant="line"           — Thin 1px volume line: no end caps or ticks,
//                              just a cream-toned groove + white filament
//                              fill (no thumb indicator by default).
//
// Features
// - `ticks`: number (count) or number[] (positions in value space). For the
//   LCD variant the internal 25/50/75 stubs are the default when ticks is
//   unset; pass `ticks={0}` to remove them.
// - `snap`: when true, drag / click / keyboard movement snaps to the nearest
//   tick. When `step > 0`, step snapping is applied in addition.
// =============================================================================

export type SliderVariant = 'lcd' | 'line';

export interface SliderProps extends ContinuousControlProps {
  /** Visual variant. Default `'lcd'`. */
  variant?: SliderVariant;
  /**
   * Accessible label used for `aria-label` when no visible `label` is passed.
   * Useful when the slider is labelled externally (e.g. by a sibling icon or
   * a caption rendered separately).
   */
  ariaLabel?: string;
  /**
   * Tick marks along the track.
   * - `number`: N evenly-spaced ticks from min to max (inclusive of both ends).
   *   For the LCD variant, N counts the interior ticks (end caps are always
   *   drawn regardless). Pass `0` to hide ticks entirely.
   * - `number[]`: explicit tick positions in value-space (clamped to [min, max]).
   * - `undefined`: LCD variant shows its signature 3 interior stubs at 25/50/75%;
   *   line variant shows no ticks.
   */
  ticks?: number | number[];
  /** When true, snap interactions (pointer + keyboard) to the nearest tick. */
  snap?: boolean;
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

// Default interior ticks for the LCD variant (25/50/75%, in [0..1] normalized).
const LCD_DEFAULT_TICKS_NORM: readonly number[] = [0.25, 0.5, 0.75];

// Filled bar transition — short linear slide matches the Paper reference.
const FILL_TRANSITION = 'width 75ms linear';
const THUMB_TRANSITION = 'left 75ms linear';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function snapToStep(value: number, step: number, min: number): number {
  if (step <= 0) return value;
  return Math.round((value - min) / step) * step + min;
}

function resolveTickPositions(
  ticks: number | number[] | undefined,
  variant: SliderVariant,
  min: number,
  max: number,
): number[] {
  if (ticks === undefined) {
    if (variant !== 'lcd') return [];
    return LCD_DEFAULT_TICKS_NORM.map((t) => min + t * (max - min));
  }
  if (typeof ticks === 'number') {
    if (ticks <= 0) return [];
    if (ticks === 1) return [min];
    const step = (max - min) / (ticks - 1);
    return Array.from({ length: ticks }, (_, i) => min + i * step);
  }
  return ticks.map((t) => clamp(t, min, max));
}

function snapToTicks(value: number, tickValues: readonly number[]): number {
  if (tickValues.length === 0) return value;
  let best = tickValues[0];
  let bestDist = Math.abs(value - best);
  for (let i = 1; i < tickValues.length; i++) {
    const d = Math.abs(value - tickValues[i]);
    if (d < bestDist) {
      best = tickValues[i];
      bestDist = d;
    }
  }
  return best;
}

// -----------------------------------------------------------------------------
// Slider
// -----------------------------------------------------------------------------

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
  variant = 'lcd',
  ariaLabel,
  ticks,
  snap = false,
  className = '',
}: SliderProps) {
  const resolvedAriaLabel = ariaLabel ?? label;
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const tickValues = useMemo(
    () => resolveTickPositions(ticks, variant, min, max),
    [ticks, variant, min, max],
  );

  // Normalised [0..1] fill ratio for the current value.
  const range = max - min;
  const norm = range === 0 ? 0 : clamp((value - min) / range, 0, 1);
  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  const applyValue = useCallback(
    (next: number) => {
      let v = clamp(next, min, max);
      if (step > 0) v = clamp(snapToStep(v, step, min), min, max);
      if (snap && tickValues.length > 0) v = snapToTicks(v, tickValues);
      onChange(v);
    },
    [min, max, step, snap, tickValues, onChange],
  );

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      applyValue(min + pct * (max - min));
    },
    [applyValue, min, max],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      updateFromPointer(e.clientX);
    },
    [disabled, updateFromPointer],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        updateFromPointer(e.clientX);
      }
    },
    [disabled, updateFromPointer],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setIsDragging(false);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const effectiveStep = step > 0 ? step : (max - min) / 100;
      const largeStep = effectiveStep * 10;

      // With snap+tick enabled, Arrow/PageUp/Down jump tick-to-tick.
      if (snap && tickValues.length > 1) {
        const sorted = [...tickValues].sort((a, b) => a - b);
        const currentIdx = sorted.indexOf(snapToTicks(value, sorted));

        let nextIdx: number | null = null;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            nextIdx = Math.min(sorted.length - 1, currentIdx + 1);
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            nextIdx = Math.max(0, currentIdx - 1);
            break;
          case 'Home':
            nextIdx = 0;
            break;
          case 'End':
            nextIdx = sorted.length - 1;
            break;
          default:
            nextIdx = null;
        }
        if (nextIdx !== null) {
          e.preventDefault();
          onChange(sorted[nextIdx]);
          return;
        }
      }

      let delta = 0;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          delta = effectiveStep;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -effectiveStep;
          break;
        case 'PageUp':
          delta = largeStep;
          break;
        case 'PageDown':
          delta = -largeStep;
          break;
        case 'Home':
          e.preventDefault();
          applyValue(min);
          return;
        case 'End':
          e.preventDefault();
          applyValue(max);
          return;
        default:
          return;
      }
      e.preventDefault();
      applyValue(value + delta);
    },
    [disabled, step, min, max, value, snap, tickValues, applyValue, onChange],
  );

  // ------------------------------------------------------------------------
  // Styles — shared pieces
  // ------------------------------------------------------------------------

  const trackStyle: CSSProperties = variant === 'lcd'
    ? {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: 1,
      transform: 'translateY(-0.5px)',
      backgroundColor: 'var(--color-ctrl-slider-track)',
    }
    : {
      position: 'relative',
      height: 1,
      backgroundColor: 'var(--color-ctrl-slider-track)',
    };

  const fillStyle: CSSProperties = variant === 'lcd'
    ? {
      position: 'absolute',
      top: '50%',
      left: 0,
      height: 1,
      transform: 'translateY(-0.5px)',
      width: `${norm * 100}%`,
      backgroundColor: 'var(--color-ctrl-slider-fill)',
      boxShadow: 'var(--ctrl-slider-glow)',
      transition: FILL_TRANSITION,
    }
    : {
      position: 'absolute',
      top: 0,
      left: 0,
      height: 1,
      width: `${norm * 100}%`,
      backgroundColor: 'var(--color-ctrl-slider-fill)',
      boxShadow: 'var(--ctrl-slider-glow)',
      transition: FILL_TRANSITION,
    };

  // Ticks positions expressed as [0..1] percentages along the track.
  const tickPercents = useMemo(
    () => (range === 0 ? [] : tickValues.map((t) => clamp((t - min) / range, 0, 1))),
    [tickValues, min, range],
  );

  const hitAreaCommon: CSSProperties = {
    touchAction: 'none',
  };

  return (
    <div
      data-rdna="ctrl-slider"
      data-variant={variant}
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

      {variant === 'lcd' ? (
        // ------------------- LCD variant -------------------
        <div
          ref={trackRef}
          role="slider"
          aria-label={resolvedAriaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-orientation="horizontal"
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={[
            'relative w-full',
            disabled ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-pointer',
            'outline-none focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          ].join(' ')}
          style={{ ...hitAreaCommon, height: 14 }}
        >
          {/* Dim 1px track line */}
          <div aria-hidden style={trackStyle} />

          {/* Filled portion from left */}
          <div aria-hidden style={fillStyle} />

          {/* Left end cap (1×14) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              height: 14,
              backgroundColor: 'var(--color-ctrl-slider-endcap)',
            }}
          />

          {/* Right end cap (1×14) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 1,
              height: 14,
              backgroundColor: 'var(--color-ctrl-slider-endcap)',
            }}
          />

          {/* Interior tick stubs (1×8) */}
          {tickPercents.map((pct, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: `${pct * 100}%`,
                width: 1,
                height: 8,
                transform: 'translate(-0.5px, -4px)',
                backgroundColor: 'var(--color-ctrl-slider-tick)',
              }}
            />
          ))}

          {/* Thumb (2×14) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: `${norm * 100}%`,
              width: 2,
              height: 14,
              transform: 'translateX(-1px)',
              backgroundColor: 'var(--color-ctrl-slider-fill)',
              boxShadow: 'var(--ctrl-slider-glow)',
              transition: THUMB_TRANSITION,
            }}
          />
        </div>
      ) : (
        // ------------------- Line variant -------------------
        <div
          ref={trackRef}
          role="slider"
          aria-label={resolvedAriaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-orientation="horizontal"
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={[
            'flex-1 w-full relative',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            'outline-none focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          ].join(' ')}
          style={{
            ...hitAreaCommon,
            // Expanded hit target while keeping the visible line 1px.
            paddingTop: 6,
            paddingBottom: 6,
          }}
        >
          <div style={trackStyle}>
            <div aria-hidden style={fillStyle} />
            {/* Optional ticks on the line variant */}
            {tickPercents.map((pct, i) => (
              <div
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${pct * 100}%`,
                  width: 1,
                  height: 6,
                  transform: 'translate(-0.5px, -3px)',
                  backgroundColor: 'var(--color-ctrl-slider-tick)',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Canonical export name. `CtrlSlider` is preserved for backward compatibility.
export { CtrlSlider as Slider };
