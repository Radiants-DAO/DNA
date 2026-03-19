'use client';

import React from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';
import { cva } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

interface MeterProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Low threshold — values at or below this are considered low */
  low?: number;
  /** High threshold — values at or above this are considered high */
  high?: number;
  /** Optimum value — determines which range is preferred */
  optimum?: number;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// CVA Variants
// ============================================================================

const trackVariants = cva(
  'w-full h-4 bg-page pixel-rounded-xs'
);

const indicatorVariants = cva('h-full transition-all duration-150 ease-out', {
  variants: {
    status: {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-danger',
    },
  },
  defaultVariants: { status: 'success' },
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determine the status color based on the value relative to
 * low/high/optimum thresholds, following the HTML meter element semantics.
 */
function getStatus(
  value: number,
  min: number,
  max: number,
  low?: number,
  high?: number,
  optimum?: number
): 'success' | 'warning' | 'error' {
  const effectiveLow = low ?? min;
  const effectiveHigh = high ?? max;

  // No thresholds set — always success
  if (low === undefined && high === undefined) {
    return 'success';
  }

  // Determine which range the optimum is in
  if (optimum !== undefined) {
    const optimumInLow = optimum <= effectiveLow;
    const optimumInHigh = optimum >= effectiveHigh;

    if (optimumInHigh) {
      // Optimum is in the high range — high values are good
      if (value >= effectiveHigh) return 'success';
      if (value > effectiveLow) return 'warning';
      return 'error';
    }

    if (optimumInLow) {
      // Optimum is in the low range — low values are good
      if (value <= effectiveLow) return 'success';
      if (value < effectiveHigh) return 'warning';
      return 'error';
    }

    // Optimum is in the middle range
    if (value > effectiveLow && value < effectiveHigh) return 'success';
    return 'warning';
  }

  // No optimum — middle range is considered good
  if (value <= effectiveLow) return 'error';
  if (value >= effectiveHigh) return 'warning';
  return 'success';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Meter component for displaying a value within a known range.
 * Semantically for measured values (disk usage, signal strength, task completion).
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
  className = '',
}: MeterProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const status = getStatus(value, min, max, low, high, optimum);

  return (
    <BaseMeter.Root data-rdna="meter" value={value} min={min} max={max}>
      <div className={`w-full ${className}`}>
        <BaseMeter.Track className={trackVariants()}>
          <BaseMeter.Indicator
            className={indicatorVariants({ status })}
            style={{ width: `${percentage}%` }}
          />
        </BaseMeter.Track>
      </div>
    </BaseMeter.Root>
  );
}

export default Meter;
