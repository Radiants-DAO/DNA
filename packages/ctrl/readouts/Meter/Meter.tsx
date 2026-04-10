'use client';

import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Meter — VU-style segmented bar with color gradient
//
// Distinct from core Meter (which wraps <meter> semantics). This is a
// visual segmented display with green → yellow → red color zones.
// =============================================================================

interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  segments?: number;
  label?: string;
  showValue?: boolean;
  size?: ControlSize;
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (v: number) => string;
  className?: string;
}

const meterVariants = cva(
  'inline-flex gap-1 select-none',
  {
    variants: {
      orientation: {
        horizontal: 'flex-col',
        vertical: 'flex-row-reverse items-end',
      },
      disabled: {
        true: 'opacity-[--ctrl-disabled-opacity]',
        false: '',
      },
    },
    defaultVariants: { orientation: 'horizontal', disabled: false },
  },
);

const segSizeH: Record<ControlSize, string> = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const segSizeV: Record<ControlSize, string> = {
  sm: 'w-2',
  md: 'w-3',
  lg: 'w-4',
};

function segmentColor(ratio: number): string {
  if (ratio < 0.6) return 'var(--ctrl-meter-low)';
  if (ratio < 0.85) return 'var(--ctrl-meter-mid)';
  return 'var(--ctrl-meter-high)';
}

export function Meter({
  value,
  min = 0,
  max = 100,
  segments = 12,
  label,
  showValue = false,
  size = 'md',
  orientation = 'horizontal',
  formatValue,
  className = '',
}: MeterProps) {
  const norm = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const litCount = Math.round(norm * segments);
  const displayValue = formatValue ? formatValue(value) : String(Math.round(value));

  const isVertical = orientation === 'vertical';

  return (
    <div
      data-rdna="ctrl-meter"
      className={meterVariants({ orientation, className })}
    >
      {(label || showValue) && (
        <div className={[
          'flex items-center justify-between',
          isVertical && 'flex-col gap-0.5',
        ].filter(Boolean).join(' ')}>
          {label && (
            <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-ctrl-value text-[0.625rem] tabular-nums">
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div
        role="meter"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className={[
          'flex gap-px',
          isVertical ? 'flex-col-reverse' : 'flex-row',
        ].join(' ')}
      >
        {Array.from({ length: segments }, (_, i) => {
          const segRatio = (i + 1) / segments;
          const isLit = i < litCount;
          return (
            <div
              key={i}
              className={[
                'rounded-[1px] transition-colors duration-fast',
                isVertical ? `${segSizeV[size]} h-1.5` : `${segSizeH[size]} flex-1`,
              ].join(' ')}
              style={{
                backgroundColor: isLit ? segmentColor(segRatio) : 'var(--ctrl-track)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
