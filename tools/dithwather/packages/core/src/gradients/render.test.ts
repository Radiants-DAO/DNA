/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { renderGradientDither, renderGradientToDataURL, renderGradientToObjectURL } from './render'
import type { ResolvedGradient } from './types'

function makeGradient(overrides: Partial<ResolvedGradient> = {}): ResolvedGradient {
  return {
    type: 'linear',
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 1 },
    ],
    angle: 90,
    center: [0.5, 0.5],
    radius: 1,
    aspect: 1,
    startAngle: 0,
    ...overrides,
  }
}

describe('renderGradientDither', () => {
  it('returns ImageData of correct dimensions', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
    })
    expect(result.width).toBe(32)
    expect(result.height).toBe(32)
    expect(result.data.length).toBe(32 * 32 * 4)
  })

  it('produces only two colors for a 2-stop gradient', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    const colors = new Set<string>()
    for (let i = 0; i < result.data.length; i += 4) {
      colors.add(`${result.data[i]},${result.data[i + 1]},${result.data[i + 2]}`)
    }
    expect(colors.size).toBe(2)
    expect(colors.has('0,0,0')).toBe(true)
    expect(colors.has('255,255,255')).toBe(true)
  })

  it('left edge is darker than right edge for 90deg linear', () => {
    const result = renderGradientDither({
      gradient: makeGradient({ angle: 90 }),
      algorithm: 'bayer4x4',
      width: 64,
      height: 16,
    })
    // Count white pixels in leftmost 16 columns vs rightmost 16
    let leftWhite = 0, rightWhite = 0
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const i = (y * 64 + x) * 4
        if (result.data[i] === 255) leftWhite++
      }
      for (let x = 48; x < 64; x++) {
        const i = (y * 64 + x) * 4
        if (result.data[i] === 255) rightWhite++
      }
    }
    expect(rightWhite).toBeGreaterThan(leftWhite)
  })

  it('all-black gradient produces all-black pixels', () => {
    const result = renderGradientDither({
      gradient: makeGradient({
        stops: [{ color: '#000000', position: 0 }, { color: '#000000', position: 1 }],
      }),
      algorithm: 'bayer4x4',
      width: 8,
      height: 8,
    })
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0)
    }
  })

  it('works with 3-stop gradient', () => {
    const result = renderGradientDither({
      gradient: makeGradient({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 0.5 },
          { color: '#0000ff', position: 1 },
        ],
      }),
      algorithm: 'bayer4x4',
      width: 32,
      height: 8,
    })
    // Should have at least 2 distinct colors
    const colors = new Set<string>()
    for (let i = 0; i < result.data.length; i += 4) {
      colors.add(`${result.data[i]},${result.data[i + 1]},${result.data[i + 2]}`)
    }
    expect(colors.size).toBeGreaterThanOrEqual(2)
  })

  it('works with all 3 Bayer algorithms', () => {
    for (const alg of ['bayer2x2', 'bayer4x4', 'bayer8x8'] as const) {
      const result = renderGradientDither({
        gradient: makeGradient(),
        algorithm: alg,
        width: 16,
        height: 16,
      })
      expect(result.width).toBe(16)
    }
  })

  it('throws for unknown algorithm', () => {
    expect(() =>
      renderGradientDither({
        gradient: makeGradient(),
        algorithm: 'invalid' as any,
        width: 16,
        height: 16,
      })
    ).toThrow('Unknown algorithm')
  })

  it('radial gradient has darker center and lighter edges for black-to-white', () => {
    const result = renderGradientDither({
      gradient: makeGradient({ type: 'radial' }),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
    })
    // Count white in 4x4 center vs 4x4 corner
    let centerWhite = 0, cornerWhite = 0
    for (let dy = -2; dy < 2; dy++) {
      for (let dx = -2; dx < 2; dx++) {
        const ci = ((16 + dy) * 32 + (16 + dx)) * 4
        if (result.data[ci] === 255) centerWhite++
        const coi = ((0 + Math.max(0, dy)) * 32 + Math.max(0, dx)) * 4
        if (result.data[coi] === 255) cornerWhite++
      }
    }
    // Radial: center = t~0 (black), edge = t~1 (white)
    // So corner should have MORE white
    expect(cornerWhite).toBeGreaterThanOrEqual(centerWhite)
  })

  it('pixelScale affects Bayer matrix sampling', () => {
    // pixelScale=1 vs pixelScale=4: different output due to coarser Bayer lookup
    const result1 = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      pixelScale: 1,
    })
    const result4 = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      pixelScale: 4,
    })
    // Outputs should differ since Bayer lookup uses different logical coords
    let diffCount = 0
    for (let i = 0; i < result1.data.length; i += 4) {
      if (result1.data[i] !== result4.data[i]) diffCount++
    }
    expect(diffCount).toBeGreaterThan(0)
  })

  it('large pixelScale produces uniform blocks (no intra-block clipping)', () => {
    const scale = 8
    const result = renderGradientDither({
      gradient: makeGradient({ type: 'radial' }),
      algorithm: 'bayer4x4',
      width: 64,
      height: 64,
      pixelScale: scale,
    })
    // For each logical block, every physical pixel must have the same color.
    const logicalW = Math.floor(64 / scale)
    const logicalH = Math.floor(64 / scale)
    for (let ly = 0; ly < logicalH; ly++) {
      for (let lx = 0; lx < logicalW; lx++) {
        const baseX = lx * scale
        const baseY = ly * scale
        const baseI = (baseY * 64 + baseX) * 4
        const r0 = result.data[baseI]
        const g0 = result.data[baseI + 1]
        const b0 = result.data[baseI + 2]
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const i = ((baseY + dy) * 64 + (baseX + dx)) * 4
            expect(result.data[i]).toBe(r0)
            expect(result.data[i + 1]).toBe(g0)
            expect(result.data[i + 2]).toBe(b0)
          }
        }
      }
    }
  })

  it('positive bias shifts toward colorB', () => {
    const neutral = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      threshold: 0,
    })
    const biased = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      threshold: 0.4,
    })
    // Count white (colorB) pixels in each
    let neutralWhite = 0, biasedWhite = 0
    for (let i = 0; i < neutral.data.length; i += 4) {
      if (neutral.data[i] === 255) neutralWhite++
      if (biased.data[i] === 255) biasedWhite++
    }
    expect(biasedWhite).toBeGreaterThan(neutralWhite)
  })

  it('negative bias shifts toward colorA', () => {
    const neutral = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      threshold: 0,
    })
    const biased = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      threshold: -0.4,
    })
    let neutralBlack = 0, biasedBlack = 0
    for (let i = 0; i < neutral.data.length; i += 4) {
      if (neutral.data[i] === 0) neutralBlack++
      if (biased.data[i] === 0) biasedBlack++
    }
    expect(biasedBlack).toBeGreaterThan(neutralBlack)
  })

  it('omitting threshold is equivalent to threshold=0', () => {
    const noThreshold = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    const zeroThreshold = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
      threshold: 0,
    })
    for (let i = 0; i < noThreshold.data.length; i++) {
      expect(noThreshold.data[i]).toBe(zeroThreshold.data[i])
    }
  })

  it('pixelScale=0 is clamped to 1 (no crash)', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
      pixelScale: 0,
    })
    expect(result.width).toBe(16)
  })

  it('rounds fractional dimensions and produces valid RGBA', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 33.7,
      height: 21.3,
    })
    // Dimensions should be rounded to integers
    expect(result.width).toBe(34)
    expect(result.height).toBe(21)
    expect(result.data.length).toBe(34 * 21 * 4)
    // Every pixel must have valid RGBA (alpha = 255)
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i + 3]).toBe(255)
    }
  })

  it('glitch > 0 produces different output than glitch=0', () => {
    const normal = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      glitch: 0,
    })
    const glitched = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      glitch: 1.5,
    })
    let diffCount = 0
    for (let i = 0; i < normal.data.length; i += 4) {
      if (normal.data[i] !== glitched.data[i]) diffCount++
    }
    expect(diffCount).toBeGreaterThan(0)
  })

  it('glitch renders every pixel instead of leaving transparent gaps', () => {
    const glitched = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
      glitch: 1.5,
    })

    for (let i = 0; i < glitched.data.length; i += 4) {
      expect(glitched.data[i + 3]).toBe(255)
    }
  })

  it('default (omitted) glitch equals explicit glitch=0', () => {
    const omitted = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    const explicit = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
      glitch: 0,
    })
    for (let i = 0; i < omitted.data.length; i++) {
      expect(omitted.data[i]).toBe(explicit.data[i])
    }
  })
})

describe('renderGradientToDataURL', () => {
  it('returns a non-empty data URL starting with "data:image/png"', () => {
    const dataURL = renderGradientToDataURL({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    expect(dataURL).toBeTruthy()
    expect(dataURL.startsWith('data:image/png')).toBe(true)
  })
})

describe('renderGradientToObjectURL', () => {
  it('calls callback with an object URL', async () => {
    // jsdom doesn't implement URL.createObjectURL — mock it
    const mockURL = 'blob:http://localhost/mock-uuid'
    const originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = () => mockURL

    try {
      const url = await new Promise<string>((resolve) => {
        renderGradientToObjectURL(
          {
            gradient: makeGradient(),
            algorithm: 'bayer4x4',
            width: 16,
            height: 16,
          },
          resolve
        )
      })
      expect(url).toBe(mockURL)
    } finally {
      URL.createObjectURL = originalCreateObjectURL
    }
  })
})
