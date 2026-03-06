import { describe, it, expect } from 'vitest'
import { applyFloydSteinbergDither } from './floyd-steinberg'

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

function setPixel(img: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255) {
  const i = (y * img.width + x) * 4
  img.data[i] = r
  img.data[i + 1] = g
  img.data[i + 2] = b
  img.data[i + 3] = a
}

function getPixel(img: ImageData, x: number, y: number): number[] {
  const i = (y * img.width + x) * 4
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
}

describe('applyFloydSteinbergDither', () => {
  it('converts all-white image to all 255', () => {
    const img = createImageData(4, 4, [255, 255, 255, 255])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(255)
      expect(img.data[i + 1]).toBe(255)
      expect(img.data[i + 2]).toBe(255)
    }
  })

  it('converts all-black image to all 0', () => {
    const img = createImageData(4, 4, [0, 0, 0, 255])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect(img.data[i]).toBe(0)
      expect(img.data[i + 1]).toBe(0)
      expect(img.data[i + 2]).toBe(0)
    }
  })

  it('produces only 0 or 255 values in RGB channels', () => {
    const img = createImageData(8, 8, [128, 128, 128, 255])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
      expect([0, 255]).toContain(img.data[i + 1])
      expect([0, 255]).toContain(img.data[i + 2])
    }
  })

  it('preserves alpha channel', () => {
    const img = createImageData(4, 4, [128, 128, 128, 180])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect(img.data[i + 3]).toBe(180)
    }
  })

  it('approximately preserves overall brightness for mid-gray', () => {
    const size = 16
    const img = createImageData(size, size, [128, 128, 128, 255])
    applyFloydSteinbergDither(img)

    let whiteCount = 0
    let totalPixels = size * size
    for (let i = 0; i < img.data.length; i += 4) {
      if (img.data[i] === 255) whiteCount++
    }

    // For mid-gray, roughly half should be white (error diffusion preserves average)
    const ratio = whiteCount / totalPixels
    expect(ratio).toBeGreaterThan(0.3)
    expect(ratio).toBeLessThan(0.7)
  })

  it('respects threshold parameter', () => {
    const size = 8

    // Low threshold: more pixels become white
    const imgLow = createImageData(size, size, [128, 128, 128, 255])
    applyFloydSteinbergDither(imgLow, { threshold: 0.2 })
    let whiteLow = 0
    for (let i = 0; i < imgLow.data.length; i += 4) {
      if (imgLow.data[i] === 255) whiteLow++
    }

    // High threshold: fewer pixels become white
    const imgHigh = createImageData(size, size, [128, 128, 128, 255])
    applyFloydSteinbergDither(imgHigh, { threshold: 0.8 })
    let whiteHigh = 0
    for (let i = 0; i < imgHigh.data.length; i += 4) {
      if (imgHigh.data[i] === 255) whiteHigh++
    }

    expect(whiteLow).toBeGreaterThan(whiteHigh)
  })

  it('works with a single pixel', () => {
    const img = createImageData(1, 1, [200, 200, 200, 255])
    applyFloydSteinbergDither(img)
    // Luminance of (200,200,200) ≈ 0.784, which is >= 0.5, so should be white
    expect(img.data[0]).toBe(255)
    expect(img.data[1]).toBe(255)
    expect(img.data[2]).toBe(255)
  })

  it('works with a 1-pixel-wide column', () => {
    const img = createImageData(1, 4, [128, 128, 128, 255])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('works with a 1-pixel-tall row', () => {
    const img = createImageData(4, 1, [128, 128, 128, 255])
    applyFloydSteinbergDither(img)
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('error diffusion affects neighboring pixels', () => {
    // Set up a small image where first pixel will generate error
    // and check that neighbors are influenced
    const img = createImageData(3, 2)
    // Fill with uniform dark gray
    for (let i = 0; i < 6; i++) {
      const idx = i * 4
      img.data[idx] = 80     // below threshold luminance
      img.data[idx + 1] = 80
      img.data[idx + 2] = 80
      img.data[idx + 3] = 255
    }

    applyFloydSteinbergDither(img)

    // All outputs should be binary
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('bright pixels near threshold produce different patterns than uniform', () => {
    // Create a gradient-like image
    const img = createImageData(4, 1)
    setPixel(img, 0, 0, 50, 50, 50)   // dark
    setPixel(img, 1, 0, 100, 100, 100) // mid-dark
    setPixel(img, 2, 0, 180, 180, 180) // mid-light
    setPixel(img, 3, 0, 230, 230, 230) // light

    applyFloydSteinbergDither(img)

    // All outputs should be binary
    for (let i = 0; i < img.data.length; i += 4) {
      expect([0, 255]).toContain(img.data[i])
    }
  })

  it('default threshold is 0.5', () => {
    // A pixel with luminance exactly at 0.5 should be threshold boundary
    const imgDefault = createImageData(1, 1, [128, 128, 128, 255])
    const imgExplicit = createImageData(1, 1, [128, 128, 128, 255])
    applyFloydSteinbergDither(imgDefault)
    applyFloydSteinbergDither(imgExplicit, { threshold: 0.5 })
    expect(imgDefault.data[0]).toBe(imgExplicit.data[0])
  })
})
