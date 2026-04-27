'use client';

// =============================================================================
// RadioVisualizer — 32-LED playback progress strip.
//
// Thin wrapper around @rdna/ctrl's LEDProgress primitive. Owns the app-level
// shape (currentTime + duration) and maps it onto the generic value/max API.
// All visuals (LCD substrate, lit cell filament, yellow+cream glow halo)
// live in the primitive's component-scoped CSS and are retheme-ready.
// =============================================================================

import { LEDProgress } from '@rdna/ctrl';

interface RadioVisualizerProps {
  currentTime: number;
  duration: number;
  className?: string;
}

export function RadioVisualizer({ currentTime, duration, className }: RadioVisualizerProps) {
  return (
    <LEDProgress
      value={currentTime}
      max={duration}
      cells={32}
      className={className}
      ariaLabel="Playback progress"
    />
  );
}
