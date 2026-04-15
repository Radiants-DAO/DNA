'use client';

import { cva } from 'class-variance-authority';
import { useDragControl } from '../../primitives/useDragControl';
import type { ContinuousControlProps, ControlSize } from '../../primitives/types';

// =============================================================================
// ArcRing — Circular progress arc with centered value display
//
// Same interaction as Knob (vertical drag) but thicker stroke, no needle.
// Intended as a read-heavy control with large centered readout.
// =============================================================================

const SWEEP = 270;
const START_ANGLE = (360 - SWEEP) / 2 + 90; // 135°

const sizeMap: Record<ControlSize, number> = { sm: 40, md: 56, lg: 72 };
const strokeMap: Record<ControlSize, number> = { sm: 4, md: 6, lg: 8 };

const arcVariants = cva(
  'inline-flex flex-col items-center gap-1 select-none',
  {
    variants: {
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
        false: '',
      },
    },
    defaultVariants: { disabled: false },
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

export function ArcRing({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0,
  label,
  disabled = false,
  size = 'md',
  showValue = true,
  formatValue,
  className = '',
}: ContinuousControlProps) {
  const dim = sizeMap[size];
  const stroke = strokeMap[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim / 2 - stroke / 2 - 2;

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

  const trackPath = arcPath(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP);
  const fillPath = norm > 0 ? arcPath(cx, cy, r, START_ANGLE, valueAngle) : '';

  const displayValue = formatValue ? formatValue(value) : String(step > 0 ? value : Math.round(value));

  return (
    <div
      data-rdna="ctrl-arc-ring"
      className={arcVariants({ disabled, className })}
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
          'cursor-grab outline-none',
          isDragging && 'cursor-grabbing',
        ].filter(Boolean).join(' ')}
      >
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-ctrl-track)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke="var(--color-ctrl-fill)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}

        {/* Centered value */}
        {showValue && (
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-ctrl-text-active)"
            fontSize={dim * 0.22}
            fontFamily="var(--font-mono, monospace)"
            style={{ filter: 'drop-shadow(0 0 4px var(--color-ctrl-glow))' }}
          >
            {displayValue}
          </text>
        )}
      </svg>
    </div>
  );
}
