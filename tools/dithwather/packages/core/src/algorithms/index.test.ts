import { describe, it, expect } from 'vitest'
import { applyDither, isOrderedAlgorithm } from './index'
import type { DitherAlgorithm } from '../types'

function createImageData(width: number, height: number, fill?: number[]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  if (fill) {
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = fill[0]
      data[i * 4 + 1] = fill[1]
      data[i * 4 + 2] = fill[2]
      data[i * 4 + 3] = fill[3] ?? 255
    }
  }
  return { data, width, height, colorSpace: 'srgb' as const }
}

describe('isOrderedAlgorithm', () => {
  it('returns true for bayer2x2', () => {
    expect(isOrderedAlgorithm('bayer2x2')).toBe(true)
  })

  it('returns true for bayer4x4', () => {
    expect(isOrderedAlgorithm('bayer4x4')).toBe(true)
  })

  it('returns true for bayer8x8', () => {
    expect(isOrderedAlgorithm('bayer8x8')).toBe(true)
  })

  it('returns false for floyd-steinberg', () => {
    expect(isOrderedAlgorithm('floyd-steinberg')).toBe(false)
  })
})

describe('applyDither', () => {
  it('routes bayer2x2 to Bayer dithering', () => {
    const img = createImageData(4, 4, [128, 128, 128, 255])
    applyDither(img, 'bayer2x2')
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('routes bayer4x4 to Bayer dithering', () => {
    const img = createImageData(4, 4, [128, 128, 128, 255])
    applyDither(img, 'bayer4x4')
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('routes bayer8x8 to Bayer dithering', () => {
    const img = createImageData(8, 8, [128, 128, 128, 255])
    applyDither(img, 'bayer8x8')
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('routes floyd-steinberg to error diffusion', () => {
    const img = createImageData(4, 4, [128, 128, 128, 255])
    applyDither(img, 'floyd-steinberg')
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('throws on unknown algorithm', () => {
    const img = createImageData(4, 4, [128, 128, 128, 255])
    expect(() => {
      applyDither(img, 'unknown' as DitherAlgorithm)
    }).toThrow('Unknown algorithm: unknown')
  })

  it('passes threshold to algorithm', () => {
    // adjustedThreshold = threshold - 0.5
    // Higher threshold => more white pixels
    const imgHigh = createImageData(8, 8, [128, 128, 128, 255])
    applyDither(imgHigh, 'bayer4x4', 0.9)
    let whiteHigh = 0
    for (let i = 0; i < imgHigh.data.length; i += 4) {
      if (imgHigh.data[i] === 255) whiteHigh++
    }

    const imgLow = createImageData(8, 8, [128, 128, 128, 255])
    applyDither(imgLow, 'bayer4x4', 0.1)
    let whiteLow = 0
    for (let i = 0; i < imgLow.data.length; i += 4) {
      if (imgLow.data[i] === 255) whiteLow++
    }

    expect(whiteHigh).toBeGreaterThanOrEqual(whiteLow)
  })

  it('default threshold is 0.5', () => {
    const img1 = createImageData(4, 4, [128, 128, 128, 255])
    const img2 = createImageData(4, 4, [128, 128, 128, 255])
    applyDither(img1, 'bayer4x4')
    applyDither(img2, 'bayer4x4', 0.5)
    expect(Array.from(img1.data)).toEqual(Array.from(img2.data))
  })

  it('produces different output for different algorithms on same input', () => {
    const imgBayer = createImageData(8, 8, [128, 128, 128, 255])
    const imgFS = createImageData(8, 8, [128, 128, 128, 255])
    applyDither(imgBayer, 'bayer4x4')
    applyDither(imgFS, 'floyd-steinberg')
    // They should produce different patterns (not guaranteed but extremely likely)
    const bayerData = Array.from(imgBayer.data)
    const fsData = Array.from(imgFS.data)
    let differ = false
    for (let i = 0; i < bayerData.length; i++) {
      if (bayerData[i] !== fsData[i]) {
        differ = true
        break
      }
    }
    expect(differ).toBe(true)
  })
})
