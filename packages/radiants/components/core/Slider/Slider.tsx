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
// Size map
// ============================================================================

const sizeStyles: Record<SliderSize, string> = {
  sm: 'h-9',
  md: 'h-10',
  lg: 'h-12',
};

// ============================================================================
// Component — Base UI Slider.Root/Control/Track/Indicator/Thumb internals
//
// Poolsuite-style retro hardware.
// Left of handle  : raised cream block (border-bottom 2px → depth/press effect).
// Right of handle : dithered black dot pattern.
// Thumb           : hidden — position shown by where the fill ends.
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
  const trackClass = sizeStyles[size];

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label    && <span className="font-sans text-base text-content-primary">{label}</span>}
          {showValue && <span className="font-sans text-sm text-content-muted">{value}</span>}
        </div>
      )}

      <BaseSlider.Root
        value={value}
        onValueChange={(newValue) => onChange(newValue as number)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={[
          'relative w-full slider-track',
          trackClass,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <BaseSlider.Control
          className="relative w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1"
        >
          <BaseSlider.Track className="relative w-full h-full">
            {/* Fill indicator — matches original scrollbar-thumb pattern */}
            <BaseSlider.Indicator
              className="absolute top-0 bottom-0 left-0 pointer-events-none rounded"
              style={{
                minWidth: '2.25rem',
                background: 'var(--color-surface-primary)',
                margin: '0.375rem 0',
                boxShadow: 'inset 0 0 0 1px var(--color-edge-primary)',
              }}
            />
            {/* Hidden thumb — position shown by fill end */}
            <BaseSlider.Thumb
              className="absolute top-0 w-0 h-0 opacity-0"
              style={{ outline: 'none' }}
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </div>
  );
}

export default Slider;
