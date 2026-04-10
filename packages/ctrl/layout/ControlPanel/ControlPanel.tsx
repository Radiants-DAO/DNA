'use client';

import React, { createContext, useContext } from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ControlPanel — Vertical stack of Sections with density context
// =============================================================================

type Density = 'compact' | 'normal' | 'spacious';

const DensityContext = createContext<Density>('normal');

export function useDensity(): Density {
  return useContext(DensityContext);
}

interface ControlPanelProps {
  children: React.ReactNode;
  density?: Density;
  size?: ControlSize;
  className?: string;
}

const gapMap: Record<Density, string> = {
  compact: 'gap-1',
  normal: 'gap-2',
  spacious: 'gap-3',
};

export function ControlPanel({
  children,
  density = 'normal',
  className = '',
}: ControlPanelProps) {
  return (
    <DensityContext.Provider value={density}>
      <div
        data-rdna="ctrl-panel"
        className={[
          'flex flex-col',
          gapMap[density],
          className,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </DensityContext.Provider>
  );
}
