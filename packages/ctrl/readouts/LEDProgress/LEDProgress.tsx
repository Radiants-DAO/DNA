'use client';

import './LEDProgress.css';

// =============================================================================
// ctrl/LEDProgress — Horizontal LED progress strip
//
// A row of uniformly-sized cells inside a framed LCD substrate. Cells light
// left→right based on `value / max`. Distinct from Meter (VU/level readout
// with color zones) and ProgressBar (segmented pixel loader) — this primitive
// is for LCD-style playback/position readouts where every cell is identical
// in color and only the fill fraction matters.
//
// All colors, spacing, and glow live in LEDProgress.css as component-scoped
// CSS variables (`--color-ctrl-led-*`, `--ctrl-led-*`). The TSX carries only
// structure and ARIA semantics.
// =============================================================================

export interface LEDProgressProps {
  /** Current value. Clamped to `[0, max]`. */
  value: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Number of cells in the strip. Defaults to 32. */
  cells?: number;
  /** Additional className applied to the root element. */
  className?: string;
  /** Accessible label for the progressbar. */
  ariaLabel?: string;
}

export function LEDProgress({
  value,
  max = 100,
  cells = 32,
  className = '',
  ariaLabel,
}: LEDProgressProps) {
  const safeMax = max > 0 ? max : 1;
  const progress = Math.max(0, Math.min(1, value / safeMax));
  const litCount = Math.floor(progress * cells);
  const clampedValue = Math.max(0, Math.min(safeMax, value));

  return (
    <div
      data-rdna="ctrl-led-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clampedValue}
      aria-label={ariaLabel}
      className={['ctrl-led-progress', className].filter(Boolean).join(' ')}
    >
      {Array.from({ length: cells }, (_, i) => {
        const isLit = i < litCount;
        return (
          <span
            key={i}
            aria-hidden
            className={[
              'ctrl-led-progress__cell',
              isLit && 'ctrl-led-progress__cell--on',
            ].filter(Boolean).join(' ')}
          />
        );
      })}
    </div>
  );
}
