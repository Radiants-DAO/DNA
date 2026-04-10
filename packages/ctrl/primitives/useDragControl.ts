'use client';

import { useCallback, useRef, useState } from 'react';
import type { DragControlConfig, DragControlReturn, Point2D } from './types';

// =============================================================================
// useDragControl — Core interaction hook for continuous controls
//
// Provides pointer-capture drag, keyboard stepping, and ARIA bindings.
// Used by Knob, Fader, Slider, XYPad, NumberScrubber, Ribbon, ArcRing.
// =============================================================================

const DEFAULT_SENSITIVITY = 4; // px per unit of value change
const LARGE_STEP_MULTIPLIER = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(value: number, step: number, min: number): number {
  if (step <= 0) return value;
  return Math.round((value - min) / step) * step + min;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export function useDragControl(config: DragControlConfig): DragControlReturn {
  const {
    axis,
    min,
    max,
    step = 0,
    sensitivity = DEFAULT_SENSITIVITY,
    disabled = false,
    inverted = false,
  } = config;

  // Unify value/onChange access — TS can't narrow a discriminated union through
  // destructuring into callbacks, so we read from the config object directly.
  const value = config.value;
  const is2D = axis === '2d';

  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; value: number | Point2D } | null>(null);

  const numericValue = typeof value === 'number' ? value : 0;

  // Typed dispatch helpers
  const emit = useCallback(
    (v: number | Point2D) => {
      if (is2D) {
        (config as Extract<DragControlConfig, { axis: '2d' }>).onChange(v as Point2D);
      } else {
        (config as Exclude<DragControlConfig, { axis: '2d' }>).onChange(v as number);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config identity is stable per render
    [is2D, config.onChange],
  );

  // -------------------------------------------------------------------------
  // Apply pointer delta
  // -------------------------------------------------------------------------

  const applyDelta = useCallback(
    (dx: number, dy: number) => {
      if (disabled) return;

      const start = startRef.current;
      if (!start) return;

      if (is2D) {
        const sv = start.value as Point2D;
        const range = max - min;
        const rawX = sv.x + (inverted ? -dx : dx) / sensitivity * (range / 100);
        const rawY = sv.y + (inverted ? dy : -dy) / sensitivity * (range / 100);
        const newX = clamp(step > 0 ? snapToStep(rawX, step, min) : rawX, min, max);
        const newY = clamp(step > 0 ? snapToStep(rawY, step, min) : rawY, min, max);
        emit({ x: newX, y: newY });
      } else {
        const sv = start.value as number;
        let delta: number;

        if (axis === 'x') {
          delta = (inverted ? -dx : dx) / sensitivity;
        } else {
          // y / radial: dragging up (negative dy) increases value
          delta = (inverted ? dy : -dy) / sensitivity;
        }

        const raw = sv + delta;
        emit(clamp(step > 0 ? snapToStep(raw, step, min) : raw, min, max));
      }
    },
    [axis, min, max, step, sensitivity, emit, disabled, inverted, is2D],
  );

  // -------------------------------------------------------------------------
  // Pointer events
  // -------------------------------------------------------------------------

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      startRef.current = { x: e.clientX, y: e.clientY, value };
      setIsDragging(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const start = startRef.current;
        if (!start) return;
        applyDelta(moveEvent.clientX - start.x, moveEvent.clientY - start.y);
      };

      const onPointerUp = () => {
        setIsDragging(false);
        startRef.current = null;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    },
    [disabled, value, applyDelta],
  );

  // -------------------------------------------------------------------------
  // Keyboard events
  // -------------------------------------------------------------------------

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const effectiveStep = step > 0 ? step : (max - min) / 100;
      const largeStep = effectiveStep * LARGE_STEP_MULTIPLIER;

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
          emit(is2D ? { x: min, y: min } : min);
          e.preventDefault();
          return;
        case 'End':
          emit(is2D ? { x: max, y: max } : max);
          e.preventDefault();
          return;
        default:
          return;
      }

      e.preventDefault();

      if (is2D) {
        const v = value as Point2D;
        const isHorizontal = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
        if (isHorizontal) {
          emit({ ...v, x: clamp(v.x + delta, min, max) });
        } else {
          emit({ ...v, y: clamp(v.y + delta, min, max) });
        }
      } else {
        emit(clamp((value as number) + delta, min, max));
      }
    },
    [disabled, step, min, max, value, emit, is2D],
  );

  // -------------------------------------------------------------------------
  // Normalized value (0–1)
  // -------------------------------------------------------------------------

  const normalizedValue = is2D
    ? { x: normalize((value as Point2D).x, min, max), y: normalize((value as Point2D).y, min, max) }
    : normalize(numericValue, min, max);

  const ariaOrientation =
    axis === 'x' ? ('horizontal' as const) :
    axis === 'y' ? ('vertical' as const) :
    undefined;

  return {
    bind: {
      onPointerDown,
      onKeyDown,
      role: 'slider' as const,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': numericValue,
      ...(ariaOrientation && { 'aria-orientation': ariaOrientation }),
      tabIndex: 0 as const,
    },
    isDragging,
    normalizedValue,
  };
}
