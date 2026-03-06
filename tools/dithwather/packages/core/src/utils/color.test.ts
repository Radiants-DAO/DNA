import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, luminance, lerpColor, adjustBrightness, adjustContrast, mixHex } from './color'

describe('hexToRgb', () => {
  it('parses 6-digit hex with #', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('parses 6-digit hex without #', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses shorthand 3-digit hex with #', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses shorthand 3-digit hex without #', () => {
    expect(hexToRgb('abc')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('parses mixed-case hex', () => {
    expect(hexToRgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 })
    expect(hexToRgb('#aaBBcc')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('parses mid-gray', () => {
    expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 })
  })
})

describe('rgbToHex', () => {
  it('converts primary colors', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00')
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff')
  })

  it('converts black and white', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff')
  })

  it('pads single-digit hex values', () => {
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203')
  })

  it('clamps values outside 0-255', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080')
  })

  it('rounds fractional values', () => {
    expect(rgbToHex({ r: 127.6, g: 0.4, b: 255 })).toBe('#8000ff')
  })

  it('roundtrips with hexToRgb', () => {
    const hex = '#3a7bcd'
    expect(rgbToHex(hexToRgb(hex))).toBe(hex)
  })
})

describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0)
  })

  it('returns 1 for white', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('uses weighted formula (BT.601)', () => {
    // Pure red: 0.299 * 255 / 255 = 0.299
    expect(luminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.299, 3)
    // Pure green: 0.587 * 255 / 255 = 0.587
    expect(luminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.587, 3)
    // Pure blue: 0.114 * 255 / 255 = 0.114
    expect(luminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.114, 3)
  })

  it('returns ~0.5 for mid-gray', () => {
    const result = luminance({ r: 128, g: 128, b: 128 })
    expect(result).toBeCloseTo(128 / 255, 3)
  })
})

describe('lerpColor', () => {
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 255, g: 255, b: 255 }
  const red = { r: 255, g: 0, b: 0 }
  const blue = { r: 0, g: 0, b: 255 }

  it('returns first color at t=0', () => {
    expect(lerpColor(red, blue, 0)).toEqual(red)
  })

  it('returns second color at t=1', () => {
    expect(lerpColor(red, blue, 1)).toEqual(blue)
  })

  it('returns midpoint at t=0.5', () => {
    expect(lerpColor(black, white, 0.5)).toEqual({ r: 128, g: 128, b: 128 })
  })

  it('interpolates each channel independently', () => {
    const a = { r: 100, g: 0, b: 200 }
    const b = { r: 200, g: 100, b: 0 }
    const result = lerpColor(a, b, 0.5)
    expect(result).toEqual({ r: 150, g: 50, b: 100 })
  })

  it('returns rounded values', () => {
    const result = lerpColor({ r: 0, g: 0, b: 0 }, { r: 10, g: 10, b: 10 }, 0.33)
    expect(result.r).toBe(Math.round(10 * 0.33))
  })
})

describe('adjustBrightness', () => {
  const gray = { r: 128, g: 128, b: 128 }

  it('returns same color when amount is 0', () => {
    expect(adjustBrightness(gray, 0)).toEqual(gray)
  })

  it('increases brightness', () => {
    const result = adjustBrightness(gray, 0.5)
    // 128 + 0.5 * 255 = 255.5, clamped to 255
    expect(result.r).toBeCloseTo(255, 0)
    expect(result.g).toBeCloseTo(255, 0)
    expect(result.b).toBeCloseTo(255, 0)
  })

  it('decreases brightness', () => {
    const result = adjustBrightness(gray, -0.5)
    // 128 - 127.5 = 0.5
    expect(result.r).toBeCloseTo(0.5, 0)
  })

  it('clamps to 0', () => {
    const result = adjustBrightness({ r: 0, g: 0, b: 0 }, -1)
    expect(result).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('clamps to 255', () => {
    const result = adjustBrightness({ r: 255, g: 255, b: 255 }, 1)
    expect(result).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('adjustContrast', () => {
  it('returns same color when amount is 0', () => {
    const input = { r: 100, g: 150, b: 200 }
    const result = adjustContrast(input, 0)
    // factor = (1+0) / (1 - 0) = 1
    expect(result.r).toBeCloseTo(100, 0)
    expect(result.g).toBeCloseTo(150, 0)
    expect(result.b).toBeCloseTo(200, 0)
  })

  it('increases contrast (pushes values away from 128)', () => {
    const result = adjustContrast({ r: 200, g: 50, b: 128 }, 0.5)
    // Values > 128 should increase, values < 128 should decrease, 128 stays
    expect(result.r).toBeGreaterThan(200)
    expect(result.g).toBeLessThan(50)
    expect(result.b).toBeCloseTo(128, 0)
  })

  it('decreases contrast (pushes values toward 128)', () => {
    const result = adjustContrast({ r: 200, g: 50, b: 128 }, -0.5)
    expect(result.r).toBeLessThan(200)
    expect(result.r).toBeGreaterThan(128)
    expect(result.g).toBeGreaterThan(50)
    expect(result.g).toBeLessThan(128)
  })

  it('clamps values', () => {
    const result = adjustContrast({ r: 255, g: 0, b: 128 }, 0.99)
    expect(result.r).toBeLessThanOrEqual(255)
    expect(result.g).toBeGreaterThanOrEqual(0)
  })
})

describe('mixHex', () => {
  it('returns midpoint gray for black and white at t=0.5', () => {
    const result = mixHex('#000000', '#ffffff', 0.5)
    expect(result).toBe('#808080')
  })

  it('returns first color at t=0', () => {
    expect(mixHex('#ff0000', '#0000ff', 0)).toBe('#ff0000')
  })

  it('returns second color at t=1', () => {
    expect(mixHex('#ff0000', '#0000ff', 1)).toBe('#0000ff')
  })
})
