'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/ProgressBar — Segmented pixel progress bar with label row
//
// Paper "Loader/Progress" style: a row of sharp-cornered segments inside
// a gold/accent border, with optional start / center / end labels beneath.
// =============================================================================

interface ProgressBarProps {
  /** Progress value 0-100 */
  value: number;
  /** Total number of segments (default 32) */
  segments?: number;
  /** Left label (e.g. current time) */
  startLabel?: string;
  /** Center label (e.g. track name) */
  centerLabel?: string;
  /** Right label (e.g. total time) */
  endLabel?: string;
  /** Component size */
  size?: ControlSize;
  /** Additional className */
  className?: string;
}

const segmentHeight: Record<ControlSize, number> = {
  sm: 6,
  md: 8,
  lg: 10,
};

export function ProgressBar({
  value,
  segments = 32,
  startLabel,
  centerLabel,
  endLabel,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clamped / 100) * segments);
  const hasLabels = !!(startLabel || centerLabel || endLabel);

  return (
    <div
      data-rdna="ctrl-progress-bar"
      className={['inline-flex w-full flex-col select-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Segment bar */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        style={{
          display: 'flex',
          gap: 'var(--ctrl-cell-gap, 1px)',
          border: '1px solid var(--color-ctrl-border-active)',
          padding: 2,
        }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const isFilled = i < filledCount;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: segmentHeight[size],
                backgroundColor: isFilled
                  ? 'var(--color-ctrl-fill)'
                  : 'var(--color-ctrl-cell-bg)',
                boxShadow: isFilled
                  ? '0 0 2px var(--color-ctrl-glow)'
                  : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Label row */}
      {hasLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            fontSize: 10,
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'uppercase',
            color: 'var(--color-ctrl-label)',
          }}
        >
          <span>{startLabel ?? ''}</span>
          <span style={{ flex: 1, textAlign: 'center' }}>
            {centerLabel ?? ''}
          </span>
          <span>{endLabel ?? ''}</span>
        </div>
      )}
    </div>
  );
}
