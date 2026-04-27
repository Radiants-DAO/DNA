'use client';

import type { PixelGrid } from '@rdna/pixel';
import type { CornerPreviewSettings, PixelMode } from '../types';
import { PatternPreview } from './PatternPreview';
import { CornerPreview } from './CornerPreview';
import { IconPreview } from './IconPreview';
import { DitherPreview } from './DitherPreview';

interface ModePreviewProps {
  mode: PixelMode;
  grid: PixelGrid | null;
  selectedEntry?: PixelGrid | null;
  cornerSize?: number;
  cornerPreviewSettings?: CornerPreviewSettings;
}

export function ModePreview({
  mode,
  grid,
  selectedEntry = null,
  cornerSize,
  cornerPreviewSettings,
}: ModePreviewProps) {
  if (mode === 'patterns') return <PatternPreview grid={grid} />;
  if (mode === 'corners') {
    return (
      <CornerPreview
        grid={grid}
        cornerSize={cornerSize ?? grid?.width ?? 8}
        settings={cornerPreviewSettings}
      />
    );
  }
  if (mode === 'dither') return <DitherPreview />;
  return <IconPreview grid={grid} selectedEntry={selectedEntry} />;
}
