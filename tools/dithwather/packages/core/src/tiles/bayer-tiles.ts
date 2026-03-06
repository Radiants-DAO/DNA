/**
 * Binary Tile Precomputation for Bayer Dithering
 *
 * Precomputes all possible threshold levels as binary integers.
 * A 4x4 tile = 16 bits. Bit N is set if pixel N is "on" at that threshold.
 *
 * Layer 1 of the 3-layer tile cache:
 *   Layer 1: TILE_BITS (binary integers, eager, SSR-safe)
 *   Layer 2: OffscreenCanvas cache (lazy, requires DOM)
 *   Layer 3: Data URL cache (lazy, requires DOM)
 */

import type { OrderedAlgorithm } from '../types'
import { BAYER_MATRICES } from '../algorithms/bayer'

// Key format: "bayer4x4_8" = algorithm + level
export const TILE_BITS = new Map<string, number>()

// Sorted cell indices per algorithm, used for incremental bit building
const SORTED_CELLS = new Map<
  string,
  Array<{ x: number; y: number; val: number }>
>()

function precompute(): void {
  const algorithms: OrderedAlgorithm[] = ['bayer2x2', 'bayer4x4', 'bayer8x8']

  for (const alg of algorithms) {
    const matrix = BAYER_MATRICES[alg]
    if (!matrix) continue
    const size = matrix.length
    const total = size * size

    // Flatten and sort by threshold value (ascending)
    const cells: Array<{ x: number; y: number; val: number }> = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        cells.push({ x, y, val: matrix[y][x] })
      }
    }
    cells.sort((a, b) => a.val - b.val)
    SORTED_CELLS.set(alg, cells)

    // Build each level incrementally
    let bits = 0
    TILE_BITS.set(`${alg}_0`, 0)

    for (let level = 1; level <= total; level++) {
      const { x, y } = cells[level - 1]
      bits |= 1 << (y * size + x)
      TILE_BITS.set(`${alg}_${level}`, bits)
    }
  }
}

// Run on module load — pure integer math, ~0.05ms, SSR-safe
precompute()

/**
 * Convert a 0-1 threshold to a discrete tile level.
 */
export function thresholdToLevel(
  algorithm: OrderedAlgorithm,
  threshold: number
): number {
  const matrix = BAYER_MATRICES[algorithm]
  if (!matrix) return 0
  const size = matrix.length
  const total = size * size
  const clamped = Math.max(0, Math.min(1, threshold))
  return Math.round(clamped * total)
}

/**
 * Get the binary bit pattern for a given algorithm and threshold.
 */
export function getTileBits(
  algorithm: OrderedAlgorithm,
  threshold: number
): number {
  const level = thresholdToLevel(algorithm, threshold)
  return TILE_BITS.get(`${algorithm}_${level}`) ?? 0
}

/**
 * Get the tile size (width/height in pixels) for an algorithm.
 */
export function getTileSize(algorithm: OrderedAlgorithm): number {
  const matrix = BAYER_MATRICES[algorithm]
  return matrix ? matrix.length : 4
}

// ============================================================================
// Layer 2 + 3: Materialization (lazy, requires DOM)
// ============================================================================

const dataURLCache = new Map<string, string>()

/**
 * Materialize a binary tile into a tiny canvas and return a data URL.
 * The tile is rendered as white-on-transparent (alpha mask):
 * - "on" pixels: rgba(255, 255, 255, 255)
 * - "off" pixels: rgba(0, 0, 0, 0)
 *
 * This makes it usable as a CSS mask-image where white = opaque, black = transparent.
 */
export function getTileDataURL(
  algorithm: OrderedAlgorithm,
  threshold: number
): string {
  const level = thresholdToLevel(algorithm, threshold)
  const cacheKey = `${algorithm}_${level}`

  const cached = dataURLCache.get(cacheKey)
  if (cached) return cached

  const bits = TILE_BITS.get(cacheKey) ?? 0
  const size = getTileSize(algorithm)

  // Create a tiny canvas
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bitIndex = y * size + x
      const isOn = (bits >> bitIndex) & 1
      const i = (y * size + x) * 4

      // White + opaque for "on", transparent for "off"
      data[i] = isOn ? 255 : 0
      data[i + 1] = isOn ? 255 : 0
      data[i + 2] = isOn ? 255 : 0
      data[i + 3] = isOn ? 255 : 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const url = canvas.toDataURL('image/png')

  dataURLCache.set(cacheKey, url)
  return url
}

/**
 * Clear the materialized tile caches. Useful for testing or memory management.
 */
export function clearTileCache(): void {
  dataURLCache.clear()
}
