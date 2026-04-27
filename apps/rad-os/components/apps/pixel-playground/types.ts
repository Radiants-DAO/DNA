import type { PixelGrid } from '@rdna/pixel';

export type PixelMode = 'corners' | 'patterns' | 'icons' | 'dither';

export type OutputFormat = 'prompt' | 'snippet' | 'bitstring' | 'svg';

export interface PixelPlaygroundState {
  mode: PixelMode;
  gridSize: number; // side length — canvas is always square for v1
  fgToken: string; // e.g. 'main'  → resolves to var(--color-main)
  bgToken: string; // e.g. 'page'  → resolves to var(--color-page)
  selectedEntry: PixelGrid | null; // currently-forked entry, or null for +New
}

export interface CornerPreviewSettings {
  pixelScale: number;
}

export const DEFAULT_CORNER_PREVIEW_SETTINGS: CornerPreviewSettings = {
  pixelScale: 6,
};

export interface ModeConfig {
  mode: PixelMode;
  label: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  /** Registry file path (for Prompt output). */
  registryFile: string;
  /** Exported symbol name to append to (for Prompt output). */
  registryName: string;
}
