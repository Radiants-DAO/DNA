'use client';

import React, { createContext, useContext } from 'react';
import type { ControlSize } from '../../primitives/types';

// =============================================================================
// ControlPanel — Control-layout container with density context.
//
// As of the rail-LCD refactor, ControlPanel NO LONGER owns its own dark
// chrome by default. The AppWindow rail and LCDScreen now provide the
// recessed LCD surface; ControlPanel just lays out sections inside
// whatever chrome wraps it, carrying density + monospace defaults.
//
// Callers that render a ControlPanel standalone (no LCD/rail parent) can
// opt into the old look via `chrome="inset"`.
// =============================================================================

type Density = 'compact' | 'normal' | 'spacious';
type Orientation = 'vertical' | 'horizontal';
type Chrome = 'none' | 'inset';

const DensityContext = createContext<Density>('normal');

export function useDensity(): Density {
  return useContext(DensityContext);
}

interface ControlPanelProps {
  children: React.ReactNode;
  density?: Density;
  size?: ControlSize;
  /**
   * Layout direction.
   *  - `vertical` (default): column stack for side rails / inspector panels.
   *  - `horizontal`: row stack for bottom rails / toolbars.
   */
  orientation?: Orientation;
  /**
   * Chrome treatment:
   *  - `none` (default): transparent — inherit surface from parent (rail/LCDScreen).
   *  - `inset`: legacy dark inset look for standalone use.
   */
  chrome?: Chrome;
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

const orientationMap: Record<Orientation, string> = {
  vertical: 'flex flex-col',
  horizontal: 'flex flex-row',
};

// Legacy inset chrome — preserved for `chrome="inset"` opt-in so standalone
// consumers (outside any rail/LCDScreen context) keep the old dark panel
// look. New default drops both the bg and the outer shadow so we don't
// double-decorate when nested inside LCDScreen or the AppWindow rail.
const INSET_CHROME_BG = 'bg-black';
const INSET_CHROME_SHADOW =
  'inset 2px 2px 9.6px #000, 0 1px 0 1px oklch(1 0 0 / 0.04), 0 -2px 0 #000';

export function ControlPanel({
  children,
  density = 'normal',
  orientation = 'vertical',
  chrome = 'none',
  className = '',
}: ControlPanelProps) {
  const isInset = chrome === 'inset';
  return (
    <DensityContext.Provider value={density}>
      <div
        data-rdna="ctrl-panel"
        data-chrome={chrome}
        data-orientation={orientation}
        className={[
          orientationMap[orientation],
          'font-mono text-xs leading-4 text-ctrl-label',
          isInset ? INSET_CHROME_BG : '',
          gapMap[density],
          paddingMap[density],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          WebkitFontSmoothing: 'antialiased',
          fontSynthesis: 'none',
          ...(isInset ? { boxShadow: INSET_CHROME_SHADOW } : null),
        }}
      >
        {children}
      </div>
    </DensityContext.Provider>
  );
}
