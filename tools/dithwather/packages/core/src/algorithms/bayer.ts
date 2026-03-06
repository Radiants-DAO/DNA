/**
 * Bayer (Ordered) Dithering
 *
 * Uses threshold matrices to create deterministic dither patterns.
 * Fast and predictable, good for UI elements.
 */

// ============================================================================
// Bayer Matrices
// ============================================================================

/**
 * 2x2 Bayer matrix (normalized 0-1)
 */
export const BAYER_2X2 = [
  [0 / 4, 2 / 4],
  [3 / 4, 1 / 4],
]

/**
 * 4x4 Bayer matrix (normalized 0-1)
 */
export const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
]

/**
 * 8x8 Bayer matrix (normalized 0-1)
 */
export const BAYER_8X8 = [
  [0 / 64, 32 / 64, 8 / 64, 40 / 64, 2 / 64, 34 / 64, 10 / 64, 42 / 64],
  [48 / 64, 16 / 64, 56 / 64, 24 / 64, 50 / 64, 18 / 64, 58 / 64, 26 / 64],
  [12 / 64, 44 / 64, 4 / 64, 36 / 64, 14 / 64, 46 / 64, 6 / 64, 38 / 64],
  [60 / 64, 28 / 64, 52 / 64, 20 / 64, 62 / 64, 30 / 64, 54 / 64, 22 / 64],
  [3 / 64, 35 / 64, 11 / 64, 43 / 64, 1 / 64, 33 / 64, 9 / 64, 41 / 64],
  [51 / 64, 19 / 64, 59 / 64, 27 / 64, 49 / 64, 17 / 64, 57 / 64, 25 / 64],
  [15 / 64, 47 / 64, 7 / 64, 39 / 64, 13 / 64, 45 / 64, 5 / 64, 37 / 64],
  [63 / 64, 31 / 64, 55 / 64, 23 / 64, 61 / 64, 29 / 64, 53 / 64, 21 / 64],
]

export type BayerMatrix = number[][]

export const BAYER_MATRICES: Record<string, BayerMatrix> = {
  bayer2x2: BAYER_2X2,
  bayer4x4: BAYER_4X4,
  bayer8x8: BAYER_8X8,
}

// ============================================================================
// Dithering Function
// ============================================================================

export interface BayerOptions {
  /** Which Bayer matrix to use */
  matrix: BayerMatrix

  /** Brightness threshold (0-1), default 0.5 */
  threshold?: number
}

/**
 * Apply Bayer dithering to image data (in place)
 *
 * @param imageData - ImageData to dither (modified in place)
 * @param options - Dithering options
 */
export function applyBayerDither(
  imageData: ImageData,
  options: BayerOptions
): void {
  const { matrix, threshold = 0.5 } = options
  const { data, width, height } = imageData
  const matrixSize = matrix.length

  // Shift threshold to center the dither pattern
  const adjustedThreshold = threshold - 0.5

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      // Get pixel luminance (0-1)
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b

      // Get threshold from Bayer matrix
      const matrixX = x % matrixSize
      const matrixY = y % matrixSize
      const ditherThreshold = matrix[matrixY][matrixX]

      // Apply threshold with adjustment
      const value = luminance + adjustedThreshold > ditherThreshold ? 255 : 0

      // Write back (grayscale for now, color mapping happens in renderer)
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      // Alpha unchanged
    }
  }
}

/**
 * Get the appropriate Bayer matrix for an algorithm name
 */
export function getBayerMatrix(
  algorithm: 'bayer2x2' | 'bayer4x4' | 'bayer8x8'
): BayerMatrix {
  return BAYER_MATRICES[algorithm]
}
