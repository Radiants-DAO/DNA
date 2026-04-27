'use client';

import type { Ref } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
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
// - sm/md/lg: rectangular track + square dot (matching Paper reference)
// =============================================================================

type ToggleSize = ControlSize | 'xs';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  id?: string;
  name?: string;
  form?: string;
  required?: boolean;
  readOnly?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  /** Form value submitted when the toggle is on. */
  valueOn?: string;
  /** Form value submitted when the toggle is off. */
  valueOff?: string;
  label?: string;
  /** Label rendered to the LEFT of the track (xs dual-label pattern) */
  leftLabel?: string;
  /** Label rendered to the RIGHT of the track (xs dual-label pattern) */
  rightLabel?: string;
  disabled?: boolean;
  size?: ToggleSize;
  className?: string;
}

// Track geometry: 1px border + 1px padding + dot on each side, dot can slide
// dot-width to the opposite end. Total width = 4 + 2*dotPx; height = 4 + dotPx.
const trackSize: Record<ToggleSize, { track: string; dot: string; translate: string }> = {
  xs: { track: 'w-5', dot: '', translate: '' },
  sm: { track: 'w-7 h-4', dot: 'size-3', translate: 'translate-x-3' },
  md: { track: 'w-9 h-5', dot: 'size-4', translate: 'translate-x-4' },
  lg: { track: 'w-11 h-6', dot: 'size-5', translate: 'translate-x-5' },
};

const DIAGONAL_PATTERN_STYLE = {
  backgroundColor: 'var(--color-ctrl-label)',
  WebkitMaskImage: 'var(--pat-diagonal)',
  maskImage: 'var(--pat-diagonal)',
  WebkitMaskSize: '8px 8px',
  maskSize: '8px 8px',
  WebkitMaskRepeat: 'repeat',
  maskRepeat: 'repeat',
} as const;

export function Toggle({
  value,
  onChange,
  label,
  leftLabel,
  rightLabel,
  disabled = false,
  readOnly = false,
  size = 'md',
  className = '',
  id,
  name,
  form,
  required,
  inputRef,
  valueOn,
  valueOff,
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
    ...(active ? { color: 'var(--color-main)' } : {}),
  });

  // --- xs track (inline rectangular) ---
  const xsTrack = (
    <div
      className="group relative flex items-center shrink-0 cursor-pointer"
      style={{
        width: 20,
        height: 10,
        padding: 1,
        border: '1px solid var(--color-ctrl-border-inactive)',
        justifyContent: value ? 'flex-end' : 'flex-start',
        backgroundColor: value ? 'var(--color-ctrl-cell-bg)' : 'var(--color-ink)',
      }}
    >
      {!value && (
        <span aria-hidden className="pointer-events-none absolute inset-0 hidden group-hover:block" style={DIAGONAL_PATTERN_STYLE} />
      )}
      <div
        className="relative shrink-0"
        style={{
          width: 8,
          height: 8,
          backgroundColor: value ? 'var(--color-main)' : 'var(--color-flip)',
        }}
      />
    </div>
  );

  // --- sm/md/lg track (rectangular) ---
  // Geometry: 1px border + 1px padding + center box. Width = 4 + 2*dotPx.
  const standardTrack = (
    <span
      className={[
        dims.track,
        'group relative overflow-hidden border transition-colors duration-fast',
        'flex items-center p-px',
        'border-ctrl-border-inactive',
        value ? 'bg-ctrl-cell-bg' : 'bg-ink',
      ].join(' ')}
    >
      {!value && (
        <span aria-hidden className="pointer-events-none absolute inset-0 hidden group-hover:block" style={DIAGONAL_PATTERN_STYLE} />
      )}
      <span
        className={[
          dims.dot,
          'relative transition-transform duration-fast',
          value ? ['bg-main', dims.translate].join(' ') : 'bg-flip translate-x-0',
        ].join(' ')}
      />
    </span>
  );

  const track = isXs ? xsTrack : standardTrack;

  return (
    <BaseSwitch.Root
      data-rdna="ctrl-toggle"
      id={id}
      checked={value}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      name={name}
      form={form}
      inputRef={inputRef}
      value={valueOn}
      uncheckedValue={valueOff}
      onCheckedChange={(checked) => onChange(checked)}
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
          className="shrink-0 text-center font-mono uppercase text-main"
          style={activeLabel(leftActive)}
        >
          {leftLabel}
        </span>
      )}

      {track}

      {/* Dual right label */}
      {hasDualLabels && rightLabel && (
        <span
          className="shrink-0 text-center font-mono uppercase text-main"
          style={activeLabel(rightActive)}
        >
          {rightLabel}
        </span>
      )}

      {/* Standard single label (skipped when dual labels are present) */}
      {!hasDualLabels && label && (
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-main">
          {label}
        </span>
      )}
    </BaseSwitch.Root>
  );
}
