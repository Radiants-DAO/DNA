'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Toggle — Slider-dot binary switch
//
// Paper ref: 05 — Toggle Indicator
// ON: gold border + glow, cream fill, dot right.
// OFF: cream 25% border, dim fill, dot left.
//
// Sizes: xs | sm | md | lg
// - xs: 16px rectangular track, 6x6 square dot, dual-label layout
// - sm/md/lg: rounded-full track + dot (original behaviour)
// =============================================================================

type ToggleSize = ControlSize | 'xs';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  /** Label rendered to the LEFT of the track (xs dual-label pattern) */
  leftLabel?: string;
  /** Label rendered to the RIGHT of the track (xs dual-label pattern) */
  rightLabel?: string;
  disabled?: boolean;
  size?: ToggleSize;
  className?: string;
}

const trackSize: Record<ToggleSize, { track: string; dot: string; translate: string }> = {
  xs: { track: 'w-4', dot: '', translate: '' },
  sm: { track: 'w-6 h-2.5', dot: 'size-1.5', translate: 'translate-x-3' },
  md: { track: 'w-8 h-3', dot: 'size-2', translate: 'translate-x-4' },
  lg: { track: 'w-9 h-3.5', dot: 'size-2.5', translate: 'translate-x-4' },
};

const GLOW = '0 0 0.5px var(--color-ctrl-glow), 0 0 3px var(--color-ctrl-glow)';

export function Toggle({
  value,
  onChange,
  label,
  leftLabel,
  rightLabel,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const dims = trackSize[size];
  const isXs = size === 'xs';
  const hasDualLabels = !!(leftLabel || rightLabel);

  // For dual labels: left is active when value=false, right when value=true
  const leftActive = !value;
  const rightActive = value;

  const activeLabel = (active: boolean) => ({
    fontSize: 8,
    lineHeight: '10px',
    ...(active
      ? { color: 'var(--color-main)', textShadow: GLOW }
      : {}),
  });

  // --- xs track (inline rectangular) ---
  const xsTrack = (
    <div
      className="flex items-center shrink-0 cursor-pointer"
      style={{
        width: 16,
        padding: 1,
        border: '1px solid var(--color-ctrl-border-active)',
        boxShadow: GLOW,
        justifyContent: value ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        className="shrink-0"
        style={{
          width: 6,
          height: 6,
          backgroundColor: 'var(--color-main)',
          boxShadow: GLOW,
        }}
      />
    </div>
  );

  // --- sm/md/lg track (rounded pill) ---
  const standardTrack = (
    <span
      className={[
        dims.track,
        'relative rounded-full border transition-all duration-fast',
        'flex items-center px-0.5',
        value
          ? 'border-ctrl-border-active bg-ctrl-fill/20'
          : 'border-ctrl-border-inactive bg-ctrl-cell-bg',
      ].join(' ')}
      style={value ? { boxShadow: '0 0 6px var(--color-ctrl-glow)' } : undefined}
    >
      <span
        className={[
          dims.dot,
          'rounded-full transition-transform duration-fast',
          value ? ['bg-ctrl-thumb', dims.translate].join(' ') : 'bg-ctrl-label translate-x-0',
        ].join(' ')}
      />
    </span>
  );

  const track = isXs ? xsTrack : standardTrack;

  return (
    <button
      type="button"
      data-rdna="ctrl-toggle"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        'inline-flex items-center select-none cursor-pointer outline-none',
        hasDualLabels ? 'gap-1' : 'gap-1.5',
        'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none cursor-default',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Dual left label */}
      {hasDualLabels && leftLabel && (
        <span
          className="shrink-0 text-center font-mono uppercase text-ctrl-label"
          style={activeLabel(leftActive)}
        >
          {leftLabel}
        </span>
      )}

      {track}

      {/* Dual right label */}
      {hasDualLabels && rightLabel && (
        <span
          className="shrink-0 text-center font-mono uppercase text-ctrl-label"
          style={activeLabel(rightActive)}
        >
          {rightLabel}
        </span>
      )}

      {/* Standard single label (skipped when dual labels are present) */}
      {!hasDualLabels && label && (
        <span className={[
          'font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-fast',
          value ? 'text-ctrl-text-active' : 'text-ctrl-label',
        ].join(' ')}
          style={value ? { textShadow: '0 0 8px var(--color-ctrl-glow)' } : undefined}
        >
          {label}
        </span>
      )}
    </button>
  );
}
