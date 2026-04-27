'use client';

import React from 'react';
import { Icon as BitmapIcon } from '../../../icons/Icon';

// ============================================================================
// Types
// ============================================================================

type SpinnerVariant = 'default' | 'dots';

interface SpinnerProps {
  /** Size in pixels */
  size?: number;
  /** Additional classes */
  className?: string;
  /** Whether loading is completed - shows checkmark */
  completed?: boolean;
  /** Visual variant */
  variant?: SpinnerVariant;
}

// ============================================================================
// Component
// ============================================================================

// ============================================================================
// Loading Dots variant
// ============================================================================

function LoadingDots({ size = 24, className = '', completed = false }: Omit<SpinnerProps, 'variant'>) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [flash, setFlash] = React.useState(false);

  React.useEffect(() => {
    if (completed) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4); // 0,1,2 = filling dots, 3 = pause/reset
    }, 300);

    return () => clearInterval(interval);
  }, [completed]);

  const dotSize = Math.max(Math.round(size * 0.28), 4);
  const gap = Math.max(Math.round(size * 0.1), 2);

  return (
    <div
      data-rdna="spinner"
      data-variant="dots"
      className={`inline-flex flex-col items-center gap-1 ${className}`}
      role="status"
      aria-label={completed ? 'Loaded' : 'Loading'}
    >
      <div className="flex items-center" style={{ gap }}>
        {[0, 1, 2].map((i) => {
          const filled = completed ? true : i < activeIndex;
          return (
            <div
              key={i}
              style={{ width: dotSize, height: dotSize }}
              className={`
                transition-colors duration-[var(--duration-base)] ease-out
                ${filled
                  ? `bg-main ${flash ? 'animate-pulse' : ''}`
                  : 'bg-accent'
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Default variant
// ============================================================================

// PixelCode loader frames - Private Use Area characters from PixelCode font
// These are the 6-frame loader animation characters (U+EE06-U+EE0B)
const LOADER_FRAMES = ['\uEE06', '\uEE07', '\uEE08', '\uEE09', '\uEE0A', '\uEE0B'];

function DefaultSpinner({ size = 24, className = '', completed = false }: Omit<SpinnerProps, 'variant'>) {
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % LOADER_FRAMES.length);
    }, 150);

    return () => clearInterval(interval);
  }, [completed]);

  return (
    <div
      data-rdna="spinner"
      className={`inline-flex items-center justify-center text-main ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size,
        fontFamily: 'var(--font-mono)',
        // eslint-disable-next-line rdna/no-raw-line-height -- reason:spinner-animation-vertical-centering owner:design-system expires:2027-01-01 issue:DNA-999
        lineHeight: 1,
      }}
      aria-label={completed ? 'Completed' : 'Loading'}
      role="status"
    >
      {completed ? <BitmapIcon name="checkmark" size={size} /> : LOADER_FRAMES[frameIndex]}
    </div>
  );
}

// ============================================================================
// Public component
// ============================================================================

/**
 * Spinner with two variants:
 * - `default`: PixelCode animated loader frames
 * - `dots`: 3 pixelated dots that fill left-to-right with LOADING/LOADED text
 */
export function Spinner({ variant = 'default', ...props }: SpinnerProps) {
  if (variant === 'dots') {
    return <LoadingDots {...props} />;
  }
  return <DefaultSpinner {...props} />;
}
