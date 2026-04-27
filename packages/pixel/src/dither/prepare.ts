import { buildMaskAsset } from '../mask.js';
import type { BayerMatrixSize } from './bayer.js';
import { bandDensity, bayerThresholdBits } from './ramp.js';
import type {
  DitherBand,
  DitherBandsOptions,
  PreparedDitherBands,
} from './types.js';

const cache = new Map<string, PreparedDitherBands>();

function cacheKey({ matrix, steps, direction }: DitherBandsOptions): string {
  return `${matrix}-${steps}-${direction}`;
}

/**
 * Sensible default step count for a given matrix size.
 *
 * Caps at 17 so larger matrices don't explode the band count.
 *
 * - 2×2  → 5  (4 + 1 endpoint)
 * - 4×4  → 17 (every distinct level inclusive)
 * - 8×8  → 17 (capped)
 * - 16×16 → 17 (capped)
 */
export function defaultDitherSteps(matrix: BayerMatrixSize): number {
  return Math.min(matrix * matrix + 1, 17);
}

/**
 * Build a stack of static n×n Bayer-thresholded tiles ("bands") that consumers
 * lay out as N equal-height overlays to draw a CSS-only stepped dither ramp.
 *
 * Within each band the tile repeats at native pixel scale (the consumer picks
 * the scale via `mask-size`). Direction = 'down' places the dense band at the
 * top of the band array.
 */
export function ditherBands(options: DitherBandsOptions): PreparedDitherBands {
  if (!Number.isInteger(options.steps) || options.steps <= 0) {
    throw new Error(`ditherBands: steps must be a positive integer, received ${options.steps}`);
  }

  const key = cacheKey(options);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const bands: DitherBand[] = [];
  for (let i = 0; i < options.steps; i++) {
    const density = bandDensity(i, options.steps, options.direction);
    const bits = bayerThresholdBits({ matrix: options.matrix, density });
    const grid = {
      name: `dither-band-${options.matrix}-${options.steps}-${options.direction}-${i}`,
      width: options.matrix,
      height: options.matrix,
      bits,
    };
    const mask = buildMaskAsset(grid);
    bands.push({ index: i, density, grid, mask });
  }

  const prepared: PreparedDitherBands = {
    matrix: options.matrix,
    steps: options.steps,
    direction: options.direction,
    bands,
  };
  cache.set(key, prepared);
  return prepared;
}
