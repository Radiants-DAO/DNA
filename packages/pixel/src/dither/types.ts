import type { PixelGrid } from '../types.js';
import type { MaskAsset, MaskHostStyle } from '../mask.js';
import type { BayerMatrixSize } from './bayer.js';
import type { DitherDirection, DitherRampOptions } from './ramp.js';

export type { BayerMatrixSize, DitherDirection, DitherRampOptions };

/** One density step in a dither ramp — a static n×n Bayer-thresholded tile. */
export interface DitherBand {
  /** 0-based band index, ordered top → bottom. */
  readonly index: number;
  /** ON-cell fraction in [0, 1] for this band. */
  readonly density: number;
  /** matrix × matrix 1-bit tile. */
  readonly grid: PixelGrid;
  /** CSS mask asset built from `grid`. */
  readonly mask: MaskAsset;
}

export interface DitherBandsOptions {
  readonly matrix: BayerMatrixSize;
  readonly steps: number;
  readonly direction: DitherDirection;
}

export interface PreparedDitherBands {
  readonly matrix: BayerMatrixSize;
  readonly steps: number;
  readonly direction: DitherDirection;
  /** Bands ordered top → bottom (dense first when direction='down'). */
  readonly bands: ReadonlyArray<DitherBand>;
}

export type { MaskAsset, MaskHostStyle };
