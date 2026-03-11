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

/* Center thumb horizontally on its value position */
const thumbHCenter: Record<SliderSize, string> = {
  sm: '-ml-[7px]',
  md: '-ml-2',
  lg: '-ml-2.5',
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
            ].join(' ')}
            data-slot="slider-track"
          >
            {/* Filled portion — yellow, sits above dot pattern pseudo-element */}
            <BaseSlider.Indicator
              className="absolute inset-y-0 left-0 z-[1] bg-action-primary rounded-xs pointer-events-none"
            />
            {/* Handle — flush inside track, lifts on hover like Switch thumb */}
            <BaseSlider.Thumb
              className={[
                'absolute top-0 z-[2] rounded-xs border border-edge-primary bg-surface-primary -my-px',
                thumbSizes[size],
                thumbHCenter[size],
                'shadow-none transition-[top,box-shadow] duration-150',
                disabled ? '' : 'hover:-top-1 hover:shadow-lifted active:-top-0.5 active:shadow-resting',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1',
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
