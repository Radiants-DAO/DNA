'use client';

import React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';

// ============================================================================
// Types
// ============================================================================

type SliderSize = 'sm' | 'md' | 'lg';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: SliderSize;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
  className?: string;
}

// ============================================================================
// Size maps — matching Switch proportions
// ============================================================================

const trackHeights: Record<SliderSize, string> = {
  sm: 'h-3.5',
  md: 'h-4',
  lg: 'h-5',
};

const thumbSizes: Record<SliderSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/* Horizontal padding on track = half thumb width, keeps thumb inside bounds */
const trackPadding: Record<SliderSize, string> = {
  sm: 'px-[7px]',
  md: 'px-2',
  lg: 'px-2.5',
};

// ============================================================================
// Component
//
// Switch-style slider: handle sits flush inside the track, lifts on hover.
// Track: cream bg + dot-pattern SVG (unfilled), yellow indicator (filled).
// ============================================================================

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  disabled = false,
  showValue = false,
  label,
  className = '',
}: SliderProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="font-heading text-sm text-content-primary">{label}</span>}
          {showValue && <span className="font-heading text-xs text-content-muted tabular-nums">{value}</span>}
        </div>
      )}

      <BaseSlider.Root
        value={value}
        onValueChange={(v) => onChange(v as number)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={[
          'group relative w-full touch-none select-none',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <BaseSlider.Control
          className={disabled ? 'pointer-events-none' : 'cursor-pointer'}
        >
          <BaseSlider.Track
            className={[
              'slider-track relative w-full overflow-visible rounded-xs border border-edge-primary bg-surface-primary',
              trackHeights[size],
              trackPadding[size],
            ].join(' ')}
            data-slot="slider-track"
          >
            {/* Filled portion — inline style overrides Base UI's position:relative + height:inherit */}
            <BaseSlider.Indicator
              className="z-[1] bg-action-primary rounded-xs pointer-events-none"
              style={{ position: 'absolute', height: 'auto', top: 0, bottom: 0 }}
            />
            {/* Handle — invisible hit area; ::before is the visual thumb */}
            <BaseSlider.Thumb
              className={[
                'absolute z-[2] overflow-visible bg-transparent border-none outline-none',
                thumbSizes[size],
                'before:content-[""] before:absolute before:inset-0',
                'before:rounded-xs before:border before:border-edge-primary before:bg-surface-primary',
                'before:shadow-none',
                disabled ? '' : 'group-hover:before:-translate-y-1 group-hover:before:shadow-lifted group-active:before:-translate-y-0.5 group-active:before:shadow-resting',
                'focus-visible:before:ring-2 focus-visible:before:ring-edge-focus focus-visible:before:ring-offset-1',
              ].join(' ')}
              data-slot="slider-thumb"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

export default Slider;
