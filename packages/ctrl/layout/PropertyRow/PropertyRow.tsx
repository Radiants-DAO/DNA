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
  className?: string;
}

export function PropertyRow({
  label,
  children,
  className = '',
}: PropertyRowProps) {
  return (
    <div
      data-rdna="ctrl-property-row"
      className={[
        'flex items-center gap-[--ctrl-cell-gap] min-h-[--ctrl-row-height]',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Label cell */}
      <span className={[
        'shrink-0 flex items-center px-1.5',
        'min-h-[--ctrl-row-height] bg-ctrl-cell-bg',
        'font-mono text-ctrl-text-active text-[0.625rem] uppercase tracking-wider',
      ].join(' ')}
        style={{ textShadow: '0 0 8px var(--glow-sun-yellow)' }}
      >
        {label}
      </span>

      {/* Control cells */}
      <div className={[
        'flex-1 flex items-center gap-[--ctrl-cell-gap]',
        'min-h-[--ctrl-row-height] bg-ctrl-cell-bg px-1.5',
      ].join(' ')}>
        {children}
      </div>
    </div>
  );
}
