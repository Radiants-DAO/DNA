'use client';

import type { ReactNode } from 'react';

// =============================================================================
// PropertyRow — Label left, control right flex row
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
        'flex items-center justify-between gap-2 min-h-6',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="font-mono text-ctrl-label text-[0.625rem] uppercase tracking-wider shrink-0">
        {label}
      </span>

      <div className="flex items-center gap-1">
        {children}
      </div>
    </div>
  );
}
