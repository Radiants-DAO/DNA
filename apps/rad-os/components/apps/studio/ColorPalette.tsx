'use client';

import { Button, Tooltip } from '@rdna/radiants/components/core';
import { PALETTE_COLORS } from './constants';

interface ColorPaletteProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPalette({ activeColor, onColorChange }: ColorPaletteProps) {
  return (
    <div className="grid grid-cols-2 gap-1 px-0.5">
      {PALETTE_COLORS.map((c) => {
        const isActive = activeColor.toLowerCase() === c.hex.toLowerCase();
        return (
          <Tooltip key={c.hex} content={c.name} position="right">
            <Button
              quiet
              size="sm"
              iconOnly
              active={isActive}
              aria-label={c.name}
              onClick={() => onColorChange(c.hex)}
              icon={
                <span
                  className="w-5 h-5 rounded-full border border-rule block"
                  style={{ backgroundColor: c.hex }}
                />
              }
            />
          </Tooltip>
        );
      })}
    </div>
  );
}
