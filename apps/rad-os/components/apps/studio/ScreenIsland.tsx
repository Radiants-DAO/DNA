'use client';

import type { ReactNode } from 'react';

// =============================================================================
// ScreenIsland — semantic control surface used to group rail sub-areas.
//
// Islands don't own their own padding — callers provide whatever internal
// spacing the grouped content needs.
// =============================================================================

interface ScreenIslandProps {
  children: ReactNode;
  className?: string;
}

export function ScreenIsland({ children, className = '' }: ScreenIslandProps) {
  return (
    <div
      className={['relative flex bg-ctrl-cell-bg', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative flex flex-1 items-stretch min-w-0">
        {children}
      </div>
    </div>
  );
}
