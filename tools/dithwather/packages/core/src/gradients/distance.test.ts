import { describe, it, expect } from 'vitest'
import {
  linearGradientValue,
  radialGradientValue,
  conicGradientValue,
  diamondGradientValue,
  reflectedGradientValue,
  gradientValue,
} from './distance'

describe('linearGradientValue', () => {
  // 90deg = left to right
  it('returns 0 at left edge for 90deg', () => {
    expect(linearGradientValue(0, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })

  it('returns 1 at right edge for 90deg', () => {
    expect(linearGradientValue(100, 50, 100, 100, 90)).toBeCloseTo(1, 1)
  })

  it('returns 0.5 at center for 90deg', () => {
    expect(linearGradientValue(50, 50, 100, 100, 90)).toBeCloseTo(0.5, 1)
  })

  // 0deg = bottom to top
  it('returns 0 at bottom for 0deg', () => {
    expect(linearGradientValue(50, 100, 100, 100, 0)).toBeCloseTo(0, 1)
  })

  it('returns 1 at top for 0deg', () => {
    expect(linearGradientValue(50, 0, 100, 100, 0)).toBeCloseTo(1, 1)
  })

  it('returns 0.5 for zero-size box', () => {
    expect(linearGradientValue(0, 0, 0, 0, 90)).toBe(0.5)
  })
})

describe('radialGradientValue', () => {
  it('returns 0 at center', () => {
    expect(radialGradientValue(50, 50, 50, 50, 50, 50)).toBe(0)
  })

  it('returns 1 at edge of circle', () => {
    expect(radialGradientValue(100, 50, 50, 50, 50, 50)).toBeCloseTo(1, 1)
  })

  it('clamps beyond radius to 1', () => {
    expect(radialGradientValue(200, 50, 50, 50, 50, 50)).toBe(1)
  })

  it('returns 1 for zero radius', () => {
    expect(radialGradientValue(50, 50, 50, 50, 0, 0)).toBe(1)
  })
})

describe('conicGradientValue', () => {
  // At 12 o'clock (directly above center), angle should be ~0
  it('returns ~0 directly above center with startAngle=0', () => {
    expect(conicGradientValue(50, 0, 50, 50, 0)).toBeCloseTo(0, 1)
  })

  // At 3 o'clock (right of center), angle should be ~0.25
  it('returns ~0.25 directly right of center', () => {
    expect(conicGradientValue(100, 50, 50, 50, 0)).toBeCloseTo(0.25, 1)
  })

  // At 6 o'clock (below center), angle should be ~0.5
  it('returns ~0.5 directly below center', () => {
    expect(conicGradientValue(50, 100, 50, 50, 0)).toBeCloseTo(0.5, 1)
  })

  it('startAngle rotates the result', () => {
    // With 90deg start, the "top" position should now read ~0.75
    const val = conicGradientValue(50, 0, 50, 50, 90)
    expect(val).toBeCloseTo(0.75, 1)
  })

  it('returns ~0.75 at 9 o clock (left of center)', () => {
    expect(conicGradientValue(0, 50, 50, 50, 0)).toBeCloseTo(0.75, 1)
  })

  it('returns a defined value at exact center', () => {
    const val = conicGradientValue(50, 50, 50, 50, 0)
    expect(val).toBeGreaterThanOrEqual(0)
    expect(val).toBeLessThanOrEqual(1)
  })
})

describe('diamondGradientValue', () => {
  it('returns 0 at center', () => {
    expect(diamondGradientValue(50, 50, 50, 50, 50, 50)).toBe(0)
  })

  it('returns 1 at corner of diamond', () => {
    // Manhattan distance: |50/50| + |0/50| = 1
    expect(diamondGradientValue(100, 50, 50, 50, 50, 50)).toBeCloseTo(1, 1)
  })

  it('returns 1 for zero radius', () => {
    expect(diamondGradientValue(50, 50, 50, 50, 0, 0)).toBe(1)
  })
})

describe('reflectedGradientValue', () => {
  // For 90deg: left=0, center=1, right=0
  it('returns 0 at left edge', () => {
    expect(reflectedGradientValue(0, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })

  it('returns 1 at center', () => {
    expect(reflectedGradientValue(50, 50, 100, 100, 90)).toBeCloseTo(1, 1)
  })

  it('returns 0 at right edge', () => {
    expect(reflectedGradientValue(100, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })
})

describe('gradientValue dispatcher', () => {
  it('dispatches linear correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'linear', 90, 50, 50, 50, 50, 0)
    expect(val).toBeCloseTo(0.5, 1)
  })

  it('dispatches radial correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'radial', 0, 50, 50, 50, 50, 0)
    expect(val).toBe(0)
  })

  it('dispatches diamond correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'diamond', 0, 50, 50, 50, 50, 0)
    expect(val).toBe(0)
  })

  it('dispatches conic correctly', () => {
    // 3 o'clock position should be ~0.25
    const val = gradientValue(100, 50, 100, 100, 'conic', 0, 50, 50, 50, 50, 0)
    expect(val).toBeCloseTo(0.25, 1)
  })

  it('dispatches reflected correctly', () => {
    // Center of 90deg reflected should be ~1
    const val = gradientValue(50, 50, 100, 100, 'reflected', 90, 50, 50, 50, 50, 0)
    expect(val).toBeCloseTo(1, 1)
  })
})
