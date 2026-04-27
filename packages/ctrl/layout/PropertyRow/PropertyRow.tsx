'use client';

import type { ReactNode } from 'react';

// =============================================================================
// PropertyRow — Cell-based label + control row
//
// Paper ref: 07 — Property Input Row
// Dark cell bg, 1px gaps, 24px height. Label cell left, control cells right.
// =============================================================================

interface PropertyRowProps {
  label: string;
  children: ReactNode;
  /** Border treatment. `flush` is for 1px-gap cell groups inside rails. */
  chrome?: 'bordered' | 'flush';
  /**
   * Row height for the flush variant. `sm` = 20px (default, dense control
   * panels), `xl` = 24px (the canonical "tag row" used across the studio
   * panels — matches the canvas-rail grid switch). Ignored when
   * `chrome="bordered"`.
   */
  size?: 'sm' | 'xl';
  /**
   * Whether to render a 1px hairline between the label cell and the value
   * cell. When `false`, the row reads as a single continuous cell — use this
   * for rows where the label is just naming the control next to it (e.g. a
   * single switch) rather than introducing a separate sub-grid.
   * Defaults to `true` for backward compat.
   */
  divider?: boolean;
  className?: string;
  valueClassName?: string;
}

export function PropertyRow({
  label,
  children,
  chrome = 'bordered',
  size = 'sm',
  divider = true,
  className = '',
  valueClassName = '',
}: PropertyRowProps) {
  const isFlush = chrome === 'flush';
  const flushHeight = size === 'xl' ? 'min-h-6 max-h-6' : 'min-h-5 max-h-5';
  const flushGap = divider ? 'gap-px bg-ink' : 'gap-0 bg-ctrl-cell-bg';

  return (
    <div
      data-rdna="ctrl-property-row"
      data-chrome={chrome}
      className={[
        'flex items-stretch',
        isFlush
          ? `${flushHeight} ${flushGap} border-0`
          : 'min-h-[--ctrl-row-height] bg-ctrl-cell-bg border border-ctrl-border-inactive',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Label cell */}
      <span className={[
        'shrink-0 flex items-center justify-center px-1.5',
        'min-w-7',
        isFlush ? 'bg-ctrl-cell-bg border-0' : 'border-r border-ctrl-border-inactive',
        'font-mono text-ctrl-text-active text-[0.625rem] uppercase tracking-wider',
      ].join(' ')}
        style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
      >
        {label}
      </span>

      {/* Value cell */}
      <div
        className={[
          'flex-1 flex items-center gap-1 px-1.5',
          isFlush && 'bg-ctrl-cell-bg self-stretch',
          valueClassName,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
