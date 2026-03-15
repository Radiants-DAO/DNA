'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface SpinnerProps {
  /** Size in pixels */
  size?: number;
  /** Additional classes */
  className?: string;
  /** Whether loading is completed - shows checkmark */
  completed?: boolean;
}

// ============================================================================
// Component
// ============================================================================

// PixelCode loader frames - Private Use Area characters from PixelCode font
// These are the 6-frame loader animation characters (U+EE06-U+EE0B)
// Frame1:  Frame2:  Frame3:  Frame4:  Frame5:  Frame6:
const LOADER_FRAMES = ['\uEE06', '\uEE07', '\uEE08', '\uEE09', '\uEE0A', '\uEE0B'];

/**
 * PixelCode loader with animated frames that loop through 6 frames
 * When completed, displays a checkmark (checkmark)
 */
export function Spinner({ size = 24, className = '', completed = false }: SpinnerProps) {
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (completed) {
      setFrameIndex(0); // Reset to first frame when completed
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % LOADER_FRAMES.length);
    }, 150); // Change frame every 150ms for smooth animation

    return () => clearInterval(interval);
  }, [completed]);

  const fontSize = size;
  const displayChar = completed ? '\u2713' : LOADER_FRAMES[frameIndex];

  return (
    <div
      data-rdna="spinner"
      className={`inline-flex items-center justify-center text-content-primary ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: fontSize,
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}
      aria-label={completed ? 'Completed' : 'Loading'}
      role="status"
    >
      {displayChar}
    </div>
  );
}

export default Spinner;
