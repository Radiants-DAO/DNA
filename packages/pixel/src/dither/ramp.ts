import { bayerMatrix, type BayerMatrixSize } from './bayer.js';

export type DitherDirection = 'up' | 'down';

export interface BayerThresholdOptions {
  readonly matrix: BayerMatrixSize;
  /** Density in [0, 1] — fraction of cells that should be ON. */
  readonly density: number;
}

export interface DitherRampOptions {
  readonly matrix: BayerMatrixSize;
  readonly steps: number;
  readonly direction: DitherDirection;
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer, received ${value}`);
  }
}

function assertUnit(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be in [0, 1], received ${value}`);
  }
}

/**
 * Build a single n×n 1-bit Bayer-thresholded tile at a given density.
 *
 * `density` is the target fraction of ON cells in [0, 1]. A cell (x, y) is ON
 * iff `density > (B[y][x] + 0.5) / matrix²`.
 *
 * - density = 0 → all OFF (empty tile)
 * - density = 1 → all ON  (solid tile)
 */
export function bayerThresholdBits({ matrix, density }: BayerThresholdOptions): string {
  assertUnit(density, 'bayerThresholdBits: density');
  const m = bayerMatrix(matrix);
  const matrixArea = matrix * matrix;
  const bits: string[] = [];

  for (let y = 0; y < matrix; y++) {
    for (let x = 0; x < matrix; x++) {
      const normalized = (m[y][x] + 0.5) / matrixArea;
      bits.push(density > normalized ? '1' : '0');
    }
  }

  return bits.join('');
}

/**
 * Density value for band index `k` in an `steps`-band ramp.
 *
 * Endpoints are inclusive: band 0 → density 0, band `steps - 1` → density 1.
 *
 * `direction: 'down'` puts the dense band at the top (top-band density = 1).
 * `direction: 'up'`   puts the dense band at the bottom.
 */
export function bandDensity(
  index: number,
  steps: number,
  direction: DitherDirection,
): number {
  if (steps === 1) return direction === 'down' ? 1 : 0;
  const t = index / (steps - 1);
  return direction === 'down' ? 1 - t : t;
}

/**
 * Build a tall (matrix × matrix·steps) bitstring that concatenates the per-band
 * Bayer-thresholded tiles top → bottom. Kept for raw introspection / code-gen.
 */
export function ditherRampBits({ matrix, steps, direction }: DitherRampOptions): string {
  assertPositiveInteger(steps, 'ditherRampBits: steps');
  const tiles: string[] = [];
  for (let i = 0; i < steps; i++) {
    tiles.push(
      bayerThresholdBits({ matrix, density: bandDensity(i, steps, direction) }),
    );
  }
  return tiles.join('');
}
