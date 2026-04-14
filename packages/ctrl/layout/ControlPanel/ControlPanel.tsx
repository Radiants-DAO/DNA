'use client';

import React, { createContext, useContext } from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ControlPanel — Dark panel container with density context
//
// Provides the dark cell-bg surface that all ctrl components sit on.
// Uses semantic tokens so light/dark mode flipping works automatically.
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
  compact: 'gap-0.5',
  normal: 'gap-1',
  spacious: 'gap-2',
};

const paddingMap: Record<Density, string> = {
  compact: 'p-1.5',
  normal: 'p-2',
  spacious: 'p-3',
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
          'flex flex-col font-mono',
          gapMap[density],
          paddingMap[density],
          className,
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </DensityContext.Provider>
  );
}
