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
// Size map — track height + square thumb at the same dimension
// ============================================================================

const sizeClasses: Record<SliderSize, { track: string; thumb: string }> = {
  sm: { track: 'h-3.5', thumb: 'size-3.5' },
  md: { track: 'h-4', thumb: 'size-4' },
  lg: { track: 'h-5', thumb: 'size-5' },
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
  const { track, thumb } = sizeClasses[size];

  return (
    <div className={className ? `space-y-2 ${className}` : 'space-y-2'}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="font-heading text-sm text-content-primary">{label}</span>}
          {showValue && <span className="font-heading text-xs text-content-muted tabular-nums">{value}</span>}
        </div>
      )}

      <BaseSlider.Root
        value={value}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={[
          'group relative w-full touch-none select-none',
          disabled && 'opacity-50 cursor-not-allowed',
        ].filter(Boolean).join(' ')}
      >
        <BaseSlider.Control
          className={disabled ? 'pointer-events-none' : 'cursor-pointer'}
        >
          <BaseSlider.Track
            className={`slider-track relative w-full overflow-visible rounded-xs border border-edge-primary bg-surface-primary ${track}`}
            data-slot="slider-track"
          >
            <BaseSlider.Indicator
              className="z-[1] bg-action-primary rounded-xs pointer-events-none"
              style={{ position: 'absolute', height: 'auto', top: 0, bottom: 0 }}
            />
            <BaseSlider.Thumb
              thumbAlignment="edge"
              className={[
                'absolute z-[2] overflow-visible bg-transparent border-none outline-none',
                thumb,
                'before:content-[""] before:absolute before:inset-0',
                'before:rounded-xs before:border before:border-edge-primary before:bg-surface-primary',
                'before:shadow-none',
                !disabled && 'group-hover:before:-translate-y-1 group-hover:before:shadow-lifted group-active:before:-translate-y-0.5 group-active:before:shadow-resting',
                'focus-visible:before:ring-2 focus-visible:before:ring-edge-focus focus-visible:before:ring-offset-1',
              ].filter(Boolean).join(' ')}
              data-slot="slider-thumb"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

export default Slider;
