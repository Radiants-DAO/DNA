'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// Knob — SVG rotary control with arc indicator and needle
//
// 270° sweep arc. Drag vertically to adjust. Keyboard: arrows, Page, Home/End.
// =============================================================================

const SWEEP = 270;
const START_ANGLE = (360 - SWEEP) / 2 + 90; // 135°

const sizeMap: Record<ControlSize, number> = { sm: 32, md: 48, lg: 64 };

const knobVariants = cva(
  'inline-flex flex-col items-center gap-1 select-none outline-none',
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
);

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function Knob({
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
  const dim = sizeMap[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const trackR = dim / 2 - 4;
  const needleR = trackR - 2;

  const { bind, normalizedValue, isDragging } = useDragControl({
    axis: 'y',
    min,
    max,
    step,
    sensitivity: 3,
    value,
    onChange,
    disabled,
  });

  const norm = normalizedValue as number;
  const valueAngle = START_ANGLE + norm * SWEEP;

  // Arcs
  const trackPath = arcPath(cx, cy, trackR, START_ANGLE, START_ANGLE + SWEEP);
  const fillPath = norm > 0 ? arcPath(cx, cy, trackR, START_ANGLE, valueAngle) : '';

  // Needle endpoint
  const needle = polarToCartesian(cx, cy, needleR, valueAngle);

  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  return (
    <div
      data-rdna="ctrl-knob"
      className={knobVariants({ size, disabled, className })}
    >
      {label && (
        <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
          {label}
        </span>
      )}

      <svg
        {...bind}
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className={[
          'cursor-grab',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--ctrl-track)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke="var(--ctrl-fill)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="var(--ctrl-thumb)" />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke="var(--ctrl-thumb)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>

      {showValue && (
        <span className="font-mono text-ctrl-value text-[0.625rem] tabular-nums">
          {displayValue}
        </span>
      )}
    </div>
  );
}
