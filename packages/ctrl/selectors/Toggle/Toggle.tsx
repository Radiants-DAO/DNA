'use client';

import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ctrl/Toggle — Slider-dot binary switch
//
// Paper ref: 05 — Toggle Indicator
// ON: gold border + glow, cream fill, dot right.
// OFF: cream 25% border, dim fill, dot left.
// =============================================================================

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

const trackSize: Record<ControlSize, { track: string; dot: string; translate: string }> = {
  sm: { track: 'w-6 h-2.5', dot: 'size-1.5', translate: 'translate-x-3' },
  md: { track: 'w-8 h-3', dot: 'size-2', translate: 'translate-x-4' },
  lg: { track: 'w-9 h-3.5', dot: 'size-2.5', translate: 'translate-x-4' },
};

export function Toggle({
  value,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const dims = trackSize[size];

  return (
    <button
      type="button"
      data-rdna="ctrl-toggle"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        'inline-flex items-center gap-1.5 select-none cursor-pointer outline-none',
        'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
        disabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none cursor-default',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Track */}
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
        {/* Dot */}
        <span
          className={[
            dims.dot,
            'rounded-full transition-transform duration-fast',
            value ? ['bg-ctrl-thumb', dims.translate].join(' ') : 'bg-ctrl-label translate-x-0',
          ].join(' ')}
        />
      </span>

      {label && (
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
