'use client';

import { Button } from '@rdna/radiants/components/core';
import type { PixelMode } from './types';
import { MODE_CONFIG } from './constants';

interface ModeNavProps {
  mode: PixelMode;
  onChange: (mode: PixelMode) => void;
}

export function ModeNav({ mode, onChange }: ModeNavProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.values(MODE_CONFIG).map((cfg) => (
        <Button
          key={cfg.mode}
          quiet={mode !== cfg.mode}
          size="sm"
          compact
          onClick={() => onChange(cfg.mode)}
        >
          {cfg.label}
        </Button>
      ))}
    </div>
  );
}
