'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cva } from 'class-variance-authority';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Meter — VU-style segmented bar with color gradient
//
// Supports single-channel or stereo (L/R) with peak hold, dB scale,
// channel labels, and configurable color zones.
// =============================================================================

interface ColorZones {
  /** Fraction (0-1) below which segments are "low" (green) */
  low: number;
  /** Fraction (0-1) below which segments are "mid" (yellow); above = "high" (red) */
  mid: number;
}

interface MeterProps {
  /** Current level: single number (mono) or [L, R] tuple (stereo), 0-100 */
  value: number | [number, number];
  min?: number;
  max?: number;
  segments?: number;
  label?: string;
  showValue?: boolean;
  size?: ControlSize;
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (v: number) => string;
  className?: string;
  /** Show peak hold indicator */
  peakHold?: boolean;
  /** Ms before peak starts falling (default 2000) */
  peakDecay?: number;
  /** Show dB scale markings (vertical only) */
  showScale?: boolean;
  /** dB values to mark on the scale (default [0, -12, -48]) */
  scaleMarks?: number[];
  /** Labels for stereo channels, e.g. ['L', 'R'] */
  channelLabels?: [string, string];
  /** Color zone thresholds as fractions (default { low: 0.6, mid: 0.85 }) */
  colorZones?: ColorZones;
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

function segmentColor(ratio: number, zones: ColorZones): string {
  if (ratio < zones.low) return 'var(--color-ctrl-meter-low)';
  if (ratio < zones.mid) return 'var(--color-ctrl-meter-mid)';
  return 'var(--color-ctrl-meter-high)';
}

// ---------------------------------------------------------------------------
// Peak-hold hook — tracks max value and decays after timeout
// ---------------------------------------------------------------------------

function usePeakHold(
  value: number,
  enabled: boolean,
  decayMs: number,
) {
  const peakRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update peak when value exceeds it
  useEffect(() => {
    if (!enabled) return;

    if (value >= peakRef.current) {
      peakRef.current = value;
      // Reset decay timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        peakRef.current = 0;
      }, decayMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, decayMs]);

  return peakRef;
}

// ---------------------------------------------------------------------------
// Single channel bar
// ---------------------------------------------------------------------------

interface ChannelBarProps {
  norm: number;
  peakNorm: number;
  segments: number;
  size: ControlSize;
  orientation: 'horizontal' | 'vertical';
  zones: ColorZones;
  peakHold: boolean;
}

function ChannelBar({
  norm,
  peakNorm,
  segments,
  size,
  orientation,
  zones,
  peakHold,
}: ChannelBarProps) {
  const litCount = Math.round(norm * segments);
  const peakSegment = peakHold ? Math.min(Math.round(peakNorm * segments) - 1, segments - 1) : -1;
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={[
        'flex gap-px',
        isVertical ? 'flex-col-reverse' : 'flex-row',
      ].join(' ')}
    >
      {Array.from({ length: segments }, (_, i) => {
        const segRatio = (i + 1) / segments;
        const isLit = i < litCount;
        const isPeak = peakHold && i === peakSegment && !isLit;
        const color = segmentColor(segRatio, zones);

        return (
          <div
            key={i}
            className={[
              'rounded-[1px] transition-colors duration-fast',
              isVertical ? `${segSizeV[size]} h-1.5` : `${segSizeH[size]} flex-1`,
            ].join(' ')}
            style={{
              backgroundColor: isLit
                ? color
                : isPeak
                  ? color
                  : 'var(--color-ctrl-cell-bg)',
              opacity: isPeak ? 0.9 : undefined,
              boxShadow: isPeak
                ? `0 0 4px ${color}`
                : isLit
                  ? undefined
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scale markings (vertical only)
// ---------------------------------------------------------------------------

interface ScaleProps {
  marks: number[];
  segments: number;
  minDb: number;
  maxDb: number;
}

function Scale({ marks, segments, minDb, maxDb }: ScaleProps) {
  const range = maxDb - minDb;
  if (range === 0) return null;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 24, height: segments * 7 /* approximate segment height */ }}
    >
      {marks.map((db) => {
        // Map dB to position: maxDb (0) = top, minDb (-48) = bottom
        const frac = 1 - (db - minDb) / range; // 0dB → frac=0 (top), -48dB → frac=1 (bottom)
        return (
          <span
            key={db}
            className="absolute right-0 font-mono leading-none"
            style={{
              top: `${frac * 100}%`,
              transform: 'translateY(-50%)',
              fontSize: 8,
              color: 'var(--color-ctrl-label)',
            }}
          >
            {db}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Meter export
// ---------------------------------------------------------------------------

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
  peakHold: peakHoldEnabled = false,
  peakDecay = 2000,
  showScale = false,
  scaleMarks = [0, -12, -48],
  channelLabels,
  colorZones = { low: 0.6, mid: 0.85 },
}: MeterProps) {
  const isStereo = Array.isArray(value);
  const leftValue = isStereo ? value[0] : value;
  const rightValue = isStereo ? value[1] : value;

  const normalise = useCallback(
    (v: number) => (max === min ? 0 : Math.max(0, Math.min(1, (v - min) / (max - min)))),
    [min, max],
  );

  const normL = normalise(leftValue);
  const normR = normalise(rightValue);

  const peakL = usePeakHold(normL, peakHoldEnabled, peakDecay);
  const peakR = usePeakHold(normR, peakHoldEnabled && isStereo, peakDecay);

  const displayValue = formatValue
    ? formatValue(leftValue)
    : String(Math.round(leftValue));

  const isVertical = orientation === 'vertical';

  // For aria, use the left/mono value
  const ariaValue = leftValue;

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
            <span
              className="font-mono text-ctrl-text-active text-[0.625rem] tabular-nums"
              style={{ textShadow: '0 0 8px var(--color-ctrl-glow)' }}
            >
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div className={['flex', isVertical ? 'flex-row gap-0.5' : 'flex-col gap-0.5'].join(' ')}>
        {/* Scale markings (vertical only) */}
        {showScale && isVertical && (
          <Scale
            marks={scaleMarks}
            segments={segments}
            minDb={Math.min(...scaleMarks)}
            maxDb={Math.max(...scaleMarks)}
          />
        )}

        {/* Meter bar(s) */}
        <div
          role="meter"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={ariaValue}
          className={[
            'flex gap-px border border-ctrl-border-inactive rounded-sm p-0.5',
            isStereo
              ? isVertical
                ? 'flex-row gap-0.5'
                : 'flex-col gap-0.5'
              : '',
          ].filter(Boolean).join(' ')}
        >
          <ChannelBar
            norm={normL}
            peakNorm={peakL.current}
            segments={segments}
            size={size}
            orientation={orientation}
            zones={colorZones}
            peakHold={peakHoldEnabled}
          />
          {isStereo && (
            <ChannelBar
              norm={normR}
              peakNorm={peakR.current}
              segments={segments}
              size={size}
              orientation={orientation}
              zones={colorZones}
              peakHold={peakHoldEnabled}
            />
          )}
        </div>

        {/* Channel labels */}
        {isStereo && channelLabels && (
          <div className={[
            'flex justify-around',
            isVertical ? 'flex-row' : 'flex-row',
          ].join(' ')}>
            {channelLabels.map((ch) => (
              <span
                key={ch}
                className="font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider text-center"
              >
                {ch}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
