'use client';

// =============================================================================
// StudioColorsRail — Stand-alone left-side dock hosting just the brush
// color swatches. It sits beside the tool rail so painting controls stay
// together while layers/export stay in the right dock.
// =============================================================================

import {
  ColorSwatch as CtrlColorSwatch,
  ControlPanel,
} from '@rdna/ctrl';
import { ScreenIsland } from './ScreenIsland';
import { type PaletteColor } from './constants';

export interface StudioColorsRailProps {
  paletteColors: ReadonlyArray<PaletteColor>;
  activeColor: string;
  onColorChange: (hex: string) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function StudioColorsRail({
  paletteColors,
  activeColor,
  onColorChange,
  orientation = 'vertical',
  className = '',
}: StudioColorsRailProps) {
  const gridClass =
    orientation === 'horizontal'
      ? 'grid grid-flow-col auto-cols-[40px] grid-rows-[40px_40px]'
      : 'grid grid-cols-[40px_40px]';

  return (
    <ControlPanel
      density="compact"
      className={['!p-0', className].filter(Boolean).join(' ')}
    >
      <ScreenIsland className="w-fit mx-auto">
        <div
          role="radiogroup"
          aria-label="Brush color"
          className={`${gridClass} gap-px p-px`}
        >
          {paletteColors.map((c) => (
            <CtrlColorSwatch
              key={c.hex}
              color={c.hex}
              size="xl"
              borderless
              selected={activeColor.toLowerCase() === c.hex.toLowerCase()}
              onClick={() => onColorChange(c.hex)}
            />
          ))}
        </div>
      </ScreenIsland>
    </ControlPanel>
  );
}
