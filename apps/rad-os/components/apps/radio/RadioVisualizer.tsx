'use client';

// =============================================================================
// RadioVisualizer — 32-LED playback progress strip.
//
// A black outlined bar containing 32 small cells. Cells light left→right
// based on (currentTime / duration). Matches the paper "above the track title"
// LCD strip.
// =============================================================================

const CELL_COUNT = 32;

interface RadioVisualizerProps {
  currentTime: number;
  duration: number;
  className?: string;
}

export function RadioVisualizer({ currentTime, duration, className = '' }: RadioVisualizerProps) {
  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const litCount = Math.round(progress * CELL_COUNT);

  return (
    <div
      data-rdna="radio-visualizer"
      className={['flex items-stretch', className].filter(Boolean).join(' ')}
      style={{
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:lcd-device-screen-always-black owner:rad-os expires:2026-12-31 issue:DNA-999
        backgroundColor: 'oklch(0 0 0)',
        outline: '1px solid var(--color-sun-yellow)',
        boxShadow: '0 0 3px var(--color-sun-yellow)',
        padding: 2,
        gap: 1,
      }}
    >
      {Array.from({ length: CELL_COUNT }, (_, i) => {
        const isLit = i < litCount;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              flex: '0 0 4px',
              height: 8,
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-cell owner:rad-os expires:2026-12-31 issue:DNA-999
              backgroundColor: isLit ? 'oklch(1 0 0)' : 'transparent',
              boxShadow: isLit
                // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-lcd-glow owner:rad-os expires:2026-12-31 issue:DNA-999
                ? 'oklch(0.9126 0.1170 93.68) 0 0 0.25px, oklch(0.9126 0.1170 93.68) 0 0 2.25px, oklch(0.9780 0.0295 94.34) 0 0 8.25px'
                : undefined,
              transition: 'background-color 120ms ease-out, box-shadow 120ms ease-out',
            }}
          />
        );
      })}
    </div>
  );
}
