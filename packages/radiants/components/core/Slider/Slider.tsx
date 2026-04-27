'use client';

import React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import type { SliderSize } from './Slider.meta';

type SliderOrientation = 'horizontal' | 'vertical';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  orientation?: SliderOrientation;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
  /** Form field name for submission */
  name?: string;
  className?: string;
  /** Values the slider snaps to. When provided, emitted values are clamped
   *  to the nearest entry, and tick marks render on the track at each point. */
  snapPoints?: readonly number[];
}

// ============================================================================
// Size map — track thickness + square thumb at the same dimension
// ============================================================================

const sizeClasses: Record<SliderSize, { hTrack: string; vTrack: string; thumb: string }> = {
  sm: { hTrack: 'h-3.5', vTrack: 'w-3.5', thumb: 'size-3.5' },
  md: { hTrack: 'h-4', vTrack: 'w-4', thumb: 'size-4' },
  lg: { hTrack: 'h-5', vTrack: 'w-5', thumb: 'size-5' },
};

// ============================================================================
// Component
//
// Switch-style slider: handle sits flush inside the track, lifts on hover.
// Track: cream bg + dot-pattern SVG (unfilled), yellow indicator (filled).
// Supports horizontal (default) and vertical orientation.
// ============================================================================

function SliderValue({ className = '' }: { className?: string }) {
  return <BaseSlider.Value className={className} />;
}

function SliderLabel({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <BaseSlider.Label className={className}>{children}</BaseSlider.Label>;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  orientation = 'horizontal',
  disabled = false,
  showValue = false,
  label,
  name,
  className = '',
  snapPoints,
}: SliderProps) {
  const { hTrack, vTrack, thumb } = sizeClasses[size];
  const vertical = orientation === 'vertical';

  const handleChange = React.useCallback(
    (raw: number) => {
      if (snapPoints && snapPoints.length > 0) {
        let nearest = snapPoints[0];
        let bestDiff = Math.abs(raw - nearest);
        for (const p of snapPoints) {
          const d = Math.abs(raw - p);
          if (d < bestDiff) {
            bestDiff = d;
            nearest = p;
          }
        }
        onChange(nearest);
      } else {
        onChange(raw);
      }
    },
    [onChange, snapPoints],
  );

  const pctFor = (p: number) =>
    max === min ? 0 : ((p - min) / (max - min)) * 100;

  // Track classes swap width/height depending on orientation. Track bg now
  // lives on the pixel-rounded mask-image layer (clipped to the staircase),
  // so the track element itself is transparent.
  const trackClasses = vertical
    ? `slider-track relative h-full overflow-visible ${vTrack}`
    : `slider-track relative w-full overflow-visible ${hTrack}`;

  // Indicator positioning: horizontal fills left→right, vertical fills bottom→top
  const indicatorStyle: React.CSSProperties = vertical
    ? { position: 'absolute', width: 'auto', left: 0, right: 0 }
    : { position: 'absolute', height: 'auto', top: 0, bottom: 0 };

  return (
    <div data-rdna="slider" className={[
        vertical ? 'h-full' : 'w-full min-w-[8rem] space-y-2',
        className,
      ].filter(Boolean).join(' ')}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="font-heading text-sm text-main">{label}</span>}
          {showValue && <span className="font-heading text-xs text-mute tabular-nums">{value}</span>}
        </div>
      )}

      <BaseSlider.Root
        value={value}
        onValueChange={(v) => handleChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        orientation={orientation}
        name={name}
        thumbAlignment="edge"
        className={[
          'group relative touch-none select-none',
          vertical ? 'h-full' : 'w-full',
          disabled && 'opacity-50 cursor-not-allowed',
        ].filter(Boolean).join(' ')}
      >
        <BaseSlider.Control
          className={[
            'flex items-center',
            vertical ? 'flex-col h-full' : 'w-full',
            disabled ? 'pointer-events-none' : 'cursor-pointer',
          ].filter(Boolean).join(' ')}
        >
          <div className={`pixel-rounded-4 bg-cream ${vertical ? 'h-full' : 'w-full'}`}>
            <BaseSlider.Track
              className={trackClasses}
              data-slot="slider-track"
            >
              <BaseSlider.Indicator
                className="z-[0] bg-accent pointer-events-none"
                style={indicatorStyle}
              />
              {snapPoints?.map((p) => (
                <div
                  key={p}
                  data-slot="slider-tick"
                  className="absolute w-0.5 h-0.5 bg-line pointer-events-none"
                  style={
                    vertical
                      ? { left: '50%', bottom: `${pctFor(p)}%`, transform: 'translate(-50%, 50%)' }
                      : { top: '50%', left: `${pctFor(p)}%`, transform: 'translate(-50%, -50%)' }
                  }
                />
              ))}
              <BaseSlider.Thumb
                data-slot="slider-thumb"
                render={(thumbProps) => {
                  const { style: thumbStyle, className: _cn, ...restThumbProps } = thumbProps;
                  return (
                    <div
                      className={`pixel-rounded-4 group/pixel bg-page hover:bg-accent transition-colors ${[thumb].filter(Boolean).join(' ')}`.trim()}
                      style={thumbStyle}
                    >
                      <div
                        {...restThumbProps}
                        data-slot="slider-thumb"
                        className={[
                          'block w-full h-full border-none outline-none',
                          'switch-thumb',
                          'focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2',
                        ].join(' ')}
                      />
                    </div>
                  );
                }}
              />
            </BaseSlider.Track>
          </div>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

// Attach Value and Label as namespace sub-components
(Slider as typeof Slider & { Value: typeof SliderValue; Label: typeof SliderLabel }).Value = SliderValue;
(Slider as typeof Slider & { Value: typeof SliderValue; Label: typeof SliderLabel }).Label = SliderLabel;
