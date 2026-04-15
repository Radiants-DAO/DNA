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
  spacious: 'p-4',
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
          'flex flex-col font-mono text-xs leading-4 bg-black text-ctrl-label',
          gapMap[density],
          paddingMap[density],
          className,
        ].filter(Boolean).join(' ')}
        style={{
          WebkitFontSmoothing: 'antialiased',
          fontSynthesis: 'none',
          boxShadow:
            'inset 2px 2px 9.6px #000, 0 1px 0 1px oklch(1 0 0 / 0.04), 0 -2px 0 #000',
        }}
      >
        {children}
      </div>
    </DensityContext.Provider>
  );
}
