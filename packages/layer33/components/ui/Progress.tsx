'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

type ProgressVariant = 'default' | 'success' | 'warning' | 'error';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Size preset */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-green',
  success: 'bg-success-green',
  warning: 'bg-accent-2',
  error: 'bg-error-red',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Progress bar with retro styling
 */
export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {/* Track */}
      <div
        className={`
          w-full
          bg-neutral-neutral-1
          border border-black
          rounded-none
          overflow-hidden
          ${sizeStyles[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Fill */}
        <div
          className={`
            h-full
            ${variantStyles[variant]}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className="mt-1 font-alfacad text-xs text-black text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Spinner
// ============================================================================

interface SpinnerProps {
  /** Size in pixels */
  size?: number;
  /** Additional classes */
  className?: string;
  /** Whether loading is completed - shows checkmark */
  completed?: boolean;
}

/**
 * Animated spinner with 3x3 grid that pulses in a wave pattern
 * Inspired by SVG Spinners - cascades from top-left to bottom-right
 * When completed, displays a checkmark (✓)
 */
export function Spinner({ size = 24, className = '', completed = false }: SpinnerProps) {
  // Calculate proportional sizes based on MobileNav reference (27px container with 4px boxes/gap/padding)
  // MobileNav: 27px container, 4px boxes (w-1 h-1), 4px gap (gap-1), 4px padding (p-1)
  // For a square grid: container = 2*padding + 3*box + 2*gap
  // 27px = 2*4 + 3*4 + 2*4 = 8 + 12 + 8 = 28px (slight rounding)
  // Ratio: 4px / 27px ≈ 0.148
  const boxSize = Math.max(1, Math.round(size * (4 / 27)));
  const gap = Math.max(1, Math.round(size * (4 / 27)));
  const padding = Math.max(1, Math.round(size * (4 / 27)));
  
  // Calculate container size to ensure square aspect ratio
  // container = 2*padding + 3*box + 2*gap
  const containerSize = 2 * padding + 3 * boxSize + 2 * gap;

  // Completion sweep delays - top-left to bottom-right (row by row)
  const completionDelays = [
    0, 0.05, 0.1,      // Row 1
    0.15, 0.2, 0.25,   // Row 2
    0.3, 0.35, 0.4,    // Row 3
  ];
  
  // Color pattern matching MobileNav hover effect:
  // Row 1: Purple, Green, Blue
  // Row 2: Green, Blue, Purple
  // Row 3: Blue, Purple, Green
  const colorAnimations = [
    'spinner-color-pulse',           // Purple
    'spinner-color-pulse-green',      // Green
    'spinner-color-pulse-blue',       // Blue
    'spinner-color-pulse-green',      // Green
    'spinner-color-pulse-blue',       // Blue
    'spinner-color-pulse',            // Purple
    'spinner-color-pulse-blue',       // Blue
    'spinner-color-pulse',            // Purple
    'spinner-color-pulse-green',      // Green
  ];

  // Alternating/randomized delays for varied flash timing
  // Creates a more organic, server-light-like effect
  const delays = [
    0, 0.15, 0.3,
    0.08, 0.22, 0.35,
    0.12, 0.28, 0.4,
  ];

  // Vary animation durations slightly for more randomization
  const durations = [
    0.5, 0.6, 0.55,
    0.65, 0.55, 0.6,
    0.58, 0.62, 0.55,
  ];

  return (
    <div
      className={`inline-block flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size,
      }}
      aria-label={completed ? 'Completed' : 'Loading'}
      role="status"
    >
      <div 
        className="grid grid-cols-3"
        style={{
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          gap: `${gap}px`,
          padding: `${padding}px`,
        }}
      >
        {Array.from({ length: 9 }).map((_, index) => {
          if (completed) {
            // Completion state: green sweep from top-left to bottom-right
            // Animation transitions from black to green, then stays green (forwards)
            return (
              <div
                key={index}
                style={{
                  width: `${boxSize}px`,
                  height: `${boxSize}px`,
                  backgroundColor: '#000000', // Start black, animation will change to green
                  animation: 'spinner-complete-sweep 0.4s ease-out forwards',
                  animationDelay: `${completionDelays[index]}s`,
                }}
              />
            );
          } else {
            // Loading state: colored flashing only (no movement)
            return (
              <div
                key={index}
                className="bg-black"
                style={{
                  width: `${boxSize}px`,
                  height: `${boxSize}px`,
                  animation: `${colorAnimations[index]} ${durations[index]}s steps(1, end) infinite`,
                  animationDelay: `${delays[index]}s`,
                }}
              />
            );
          }
        })}
      </div>
    </div>
  );
}

export default Progress;

