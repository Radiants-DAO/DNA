/** A 1-bit pixel grid — the universal primitive. */
export interface PixelGrid {
  name: string;
  width: number;
  height: number;
  /** Binary string of 0s and 1s, length = width × height. */
  bits: string;
}

/** Corner set — top-left grid + metadata, other corners derived by mirroring. */
export interface PixelCornerSet {
  name: string;
  /** Top-left corner grid (mirrored for the other 3 corners). */
  tl: PixelGrid;
  /** Border pixel color layer bits (same grid, drawn in border color). */
  border?: PixelGrid;
  /** Pixel border thickness — default 1. */
  borderWidth?: number;
}

/** Spatial pattern for bit-flip transitions. */
export type TransitionMode = 'random' | 'radial' | 'scanline' | 'scatter';

/** Transition config between two grids of the same dimensions. */
export interface TransitionConfig {
  from: PixelGrid;
  to: PixelGrid;
  mode: TransitionMode;
  /** Duration in ms. */
  duration: number;
}

/** Keyframe animation — array of frames at fixed FPS. */
export interface PixelAnimation {
  name: string;
  width: number;
  height: number;
  fps: number;
  frames: string[];
}

/** Corner position. */
export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';
