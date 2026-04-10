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
    value,
    onChange,
    disabled = false,
    inverted = false,
  } = config;

  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; value: number | Point2D } | null>(null);

  // -------------------------------------------------------------------------
  // Value helpers
  // -------------------------------------------------------------------------

  const numericValue = typeof value === 'number' ? value : 0;

  const applyDelta = useCallback(
    (dx: number, dy: number) => {
      if (disabled) return;

      const start = startRef.current;
      if (!start) return;

      if (axis === '2d') {
        const sv = start.value as Point2D;
        const range = max - min;
        const rawX = sv.x + (inverted ? -dx : dx) / sensitivity * (range / 100);
        const rawY = sv.y + (inverted ? dy : -dy) / sensitivity * (range / 100);
        const newX = clamp(step > 0 ? snapToStep(rawX, step, min) : rawX, min, max);
        const newY = clamp(step > 0 ? snapToStep(rawY, step, min) : rawY, min, max);
        onChange({ x: newX, y: newY });
      } else {
        const sv = start.value as number;
        let delta: number;

        if (axis === 'x') {
          delta = (inverted ? -dx : dx) / sensitivity;
        } else if (axis === 'y') {
          // Y-axis: dragging up (negative dy) increases value
          delta = (inverted ? dy : -dy) / sensitivity;
        } else {
          // radial: use vertical movement as primary
          delta = (inverted ? dy : -dy) / sensitivity;
        }

        const raw = sv + delta;
        const clamped = clamp(step > 0 ? snapToStep(raw, step, min) : raw, min, max);
        onChange(clamped);
      }
    },
    [axis, min, max, step, sensitivity, onChange, disabled, inverted],
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
        const dx = moveEvent.clientX - start.x;
        const dy = moveEvent.clientY - start.y;
        applyDelta(dx, dy);
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
          onChange(min);
          e.preventDefault();
          return;
        case 'End':
          onChange(max);
          e.preventDefault();
          return;
        default:
          return;
      }

      e.preventDefault();

      if (axis === '2d') {
        const v = value as Point2D;
        const isHorizontal = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
        if (isHorizontal) {
          onChange({ ...v, x: clamp(v.x + delta, min, max) });
        } else {
          onChange({ ...v, y: clamp(v.y + delta, min, max) });
        }
      } else {
        const v = value as number;
        onChange(clamp(v + delta, min, max));
      }
    },
    [disabled, step, min, max, value, onChange, axis],
  );

  // -------------------------------------------------------------------------
  // Normalized value (0–1)
  // -------------------------------------------------------------------------

  const normalizedValue =
    axis === '2d'
      ? { x: normalize((value as Point2D).x, min, max), y: normalize((value as Point2D).y, min, max) }
      : normalize(numericValue, min, max);

  // -------------------------------------------------------------------------
  // ARIA orientation
  // -------------------------------------------------------------------------

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
