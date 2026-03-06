/**
 * Dithering Algorithms
 */

export {
  applyBayerDither,
  getBayerMatrix,
  BAYER_2X2,
  BAYER_4X4,
  BAYER_8X8,
  BAYER_MATRICES,
  type BayerMatrix,
  type BayerOptions,
} from './bayer'

export {
  applyFloydSteinbergDither,
  type FloydSteinbergOptions,
} from './floyd-steinberg'

import type { DitherAlgorithm, OrderedAlgorithm } from '../types'
import { applyBayerDither, getBayerMatrix } from './bayer'
import { applyFloydSteinbergDither } from './floyd-steinberg'

/**
 * Check if algorithm is an ordered (Bayer) type
 */
export function isOrderedAlgorithm(
  algorithm: DitherAlgorithm
): algorithm is OrderedAlgorithm {
  return algorithm.startsWith('bayer')
}

/**
 * Apply the specified dithering algorithm to image data
 */
export function applyDither(
  imageData: ImageData,
  algorithm: DitherAlgorithm,
  threshold: number = 0.5
): void {
  if (isOrderedAlgorithm(algorithm)) {
    const matrix = getBayerMatrix(algorithm)
    applyBayerDither(imageData, { matrix, threshold })
  } else if (algorithm === 'floyd-steinberg') {
    applyFloydSteinbergDither(imageData, { threshold })
  } else {
    throw new Error(`Unknown algorithm: ${algorithm}`)
  }
}
