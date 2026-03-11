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
// Size maps
// ============================================================================

const trackHeights: Record<SliderSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const thumbSizes: Record<SliderSize, string> = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

/* Center thumb on track: top-1/2 + negative margin = half thumb size */
const thumbOffsets: Record<SliderSize, string> = {
  sm: '-mt-1.5 -ml-1.5',
  md: '-mt-2 -ml-2',
  lg: '-mt-2.5 -ml-2.5',
};

// ============================================================================
// Component
//
// Retro hardware slider matching the Switch aesthetic.
// Thin dot-pattern rail with a square handle that lifts on hover.
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
          'relative w-full touch-none select-none',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <BaseSlider.Control
          className={[
            'relative flex items-center w-full py-3',
            disabled ? 'pointer-events-none' : 'cursor-pointer',
          ].join(' ')}
        >
          <BaseSlider.Track
            className={`slider-track relative w-full overflow-visible ${trackHeights[size]} rounded-xs`}
            data-slot="slider-track"
          >
            <BaseSlider.Indicator
              className="absolute inset-y-0 left-0 bg-surface-primary rounded-xs shadow-inset pointer-events-none"
            />
            <BaseSlider.Thumb
              className={[
                'absolute top-1/2 rounded-xs border border-edge-primary bg-surface-primary',
                thumbSizes[size],
                thumbOffsets[size],
                'shadow-none transition-[box-shadow,translate] duration-150',
                disabled ? '' : 'hover:-translate-y-1 hover:shadow-lifted active:-translate-y-0.5 active:shadow-resting',
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
