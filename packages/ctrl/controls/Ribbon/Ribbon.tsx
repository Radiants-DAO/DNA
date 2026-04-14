'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cva } from 'class-variance-authority';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// Ribbon — Continuous strip with absolute position mapping
//
// Touch/click position = value directly (no delta drag). Spring-return variant
// snaps to center on release. Horizontal strip.
// =============================================================================

const widthMap: Record<ControlSize, string> = {
  sm: 'min-w-[4rem]',
  md: 'min-w-[8rem]',
  lg: 'min-w-[12rem]',
};

const ribbonVariants = cva(
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

interface RibbonProps extends ContinuousControlProps {
  /** When true, value snaps to center ((min+max)/2) on pointer release */
  springReturn?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function Ribbon({
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
  springReturn = false,
  className = '',
}: RibbonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const norm = max === min ? 0 : (value - min) / (max - min);
  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  const positionToValue = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      let raw = min + ratio * (max - min);
      if (step > 0) {
        raw = Math.round((raw - min) / step) * step + min;
      }
      onChange(clamp(raw, min, max));
    },
    [min, max, step, onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsActive(true);
      positionToValue(e.clientX);

      const onMove = (me: PointerEvent) => positionToValue(me.clientX);
      const onUp = () => {
        setIsActive(false);
        if (springReturn) {
          onChange((min + max) / 2);
        }
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [disabled, positionToValue, springReturn, min, max, onChange],
  );

  return (
    <div
      data-rdna="ctrl-ribbon"
      className={ribbonVariants({ size, disabled, className })}
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
              style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
            >
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        className={[
          'relative h-3 w-full rounded-full bg-ctrl-cell-bg border border-ctrl-border-inactive overflow-hidden',
          'cursor-pointer outline-none',
          'focus-visible:ring-2 focus-visible:ring-ctrl-glow',
          isActive && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Position indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-ctrl-fill pointer-events-none transition-[left] duration-75"
          style={{ left: `${norm * 100}%` }}
        />
      </div>
    </div>
  );
}
