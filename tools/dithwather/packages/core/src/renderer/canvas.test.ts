/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { renderToCanvas, renderToDataURL } from './canvas'

describe('renderToCanvas', () => {
  it('returns a result with canvas, imageData, and toDataURL', () => {
    const result = renderToCanvas({}, { width: 4, height: 4 })
    expect(result.canvas).toBeDefined()
    expect(result.imageData).toBeDefined()
    expect(result.toDataURL).toBeTypeOf('function')
  })

  it('creates canvas with correct dimensions', () => {
    const result = renderToCanvas({}, { width: 10, height: 20 })
    expect(result.canvas.width).toBe(10)
    expect(result.canvas.height).toBe(20)
  })

  it('applies pixelRatio to canvas dimensions', () => {
    const result = renderToCanvas({}, { width: 10, height: 20, pixelRatio: 2 })
    expect(result.canvas.width).toBe(20)
    expect(result.canvas.height).toBe(40)
  })

  it('returns imageData with correct dimensions', () => {
    const result = renderToCanvas({}, { width: 8, height: 6 })
    expect(result.imageData.width).toBe(8)
    expect(result.imageData.height).toBe(6)
  })

  it('uses the provided solid source color instead of the default gradient', () => {
    const black = renderToCanvas(
      {},
      { width: 4, height: 4, source: { type: 'solid', color: '#000000' } }
    )
    const white = renderToCanvas(
      {},
      { width: 4, height: 4, source: { type: 'solid', color: '#ffffff' } }
    )

    expect(Array.from(black.imageData.data)).not.toEqual(Array.from(white.imageData.data))

    for (let i = 0; i < black.imageData.data.length; i += 4) {
      expect(black.imageData.data[i]).toBe(0)
      expect(black.imageData.data[i + 1]).toBe(0)
      expect(black.imageData.data[i + 2]).toBe(0)
      expect(white.imageData.data[i]).toBe(255)
      expect(white.imageData.data[i + 1]).toBe(255)
      expect(white.imageData.data[i + 2]).toBe(255)
    }
  })

  it('dithers output to binary values', () => {
    const result = renderToCanvas(
      { algorithm: 'bayer4x4' },
      { width: 8, height: 8 }
    )
    const { data } = result.imageData
    for (let i = 0; i < data.length; i += 4) {
      // After dithering and color mapping, pixels should be the fg or bg color
      // Default duotone colors: fg=#ffffff, bg=#000000
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      expect(r === 0 || r === 255).toBe(true)
      expect(g === 0 || g === 255).toBe(true)
      expect(b === 0 || b === 255).toBe(true)
    }
  })

  it('applies duotone color mapping with custom colors', () => {
    const result = renderToCanvas(
      {
        algorithm: 'bayer2x2',
        colorMode: 'duotone',
        colors: { fg: '#ff0000', bg: '#0000ff' },
      },
      { width: 4, height: 4 }
    )
    const { data } = result.imageData
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Each pixel should be either red (255,0,0) or blue (0,0,255)
      const isRed = r === 255 && g === 0 && b === 0
      const isBlue = r === 0 && g === 0 && b === 255
      expect(isRed || isBlue).toBe(true)
    }
  })

  it('applies mono color mapping (fg on transparent)', () => {
    const result = renderToCanvas(
      {
        algorithm: 'bayer2x2',
        colorMode: 'mono',
        colors: { fg: '#00ff00' },
      },
      { width: 4, height: 4 }
    )
    const { data } = result.imageData
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      // Each pixel should be either green with full alpha, or transparent black
      const isGreen = r === 0 && g === 255 && b === 0 && a === 255
      const isTransparent = r === 0 && g === 0 && b === 0 && a === 0
      expect(isGreen || isTransparent).toBe(true)
    }
  })

  it('works with floyd-steinberg algorithm', () => {
    const result = renderToCanvas(
      { algorithm: 'floyd-steinberg' },
      { width: 8, height: 8 }
    )
    const { data } = result.imageData
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      expect(r === 0 || r === 255).toBe(true)
    }
  })

  it('applies brightness adjustment', () => {
    // High brightness should produce more white pixels
    const resultBright = renderToCanvas(
      { algorithm: 'bayer4x4', brightness: 0.8 },
      { width: 8, height: 8 }
    )
    let whiteBright = 0
    for (let i = 0; i < resultBright.imageData.data.length; i += 4) {
      if (resultBright.imageData.data[i] === 255) whiteBright++
    }

    const resultDark = renderToCanvas(
      { algorithm: 'bayer4x4', brightness: -0.8 },
      { width: 8, height: 8 }
    )
    let whiteDark = 0
    for (let i = 0; i < resultDark.imageData.data.length; i += 4) {
      if (resultDark.imageData.data[i] === 255) whiteDark++
    }

    expect(whiteBright).toBeGreaterThanOrEqual(whiteDark)
  })

  it('blends the original source with the dithered result using intensity', () => {
    const original = renderToCanvas(
      { intensity: 0 },
      { width: 4, height: 4, source: { type: 'solid', color: '#808080' } }
    )
    const dithered = renderToCanvas(
      { intensity: 1 },
      { width: 4, height: 4, source: { type: 'solid', color: '#808080' } }
    )

    for (let i = 0; i < original.imageData.data.length; i += 4) {
      expect(original.imageData.data[i]).toBe(128)
      expect(original.imageData.data[i + 1]).toBe(128)
      expect(original.imageData.data[i + 2]).toBe(128)
      expect(original.imageData.data[i + 3]).toBe(255)

      expect(dithered.imageData.data[i] === 0 || dithered.imageData.data[i] === 255).toBe(true)
    }
  })

  it('uses default config when partial config provided', () => {
    // Should not throw when only algorithm is specified
    const result = renderToCanvas(
      { algorithm: 'bayer8x8' },
      { width: 8, height: 8 }
    )
    expect(result.imageData).toBeDefined()
  })

  it('uses default config when empty config provided', () => {
    const result = renderToCanvas({}, { width: 4, height: 4 })
    expect(result.imageData).toBeDefined()
  })

  it('toDataURL returns a data URL string', () => {
    const result = renderToCanvas({}, { width: 4, height: 4 })
    const dataUrl = result.toDataURL()
    expect(dataUrl).toMatch(/^data:image\/png/)
  })
})

describe('renderToDataURL', () => {
  it('returns a data URL string', () => {
    const result = renderToDataURL({}, { width: 4, height: 4 })
    expect(result).toMatch(/^data:image\/png/)
  })
})
