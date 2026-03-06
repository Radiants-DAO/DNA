/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  TILE_BITS,
  thresholdToLevel,
  getTileBits,
  getTileDataURL,
  getTileSize,
  clearTileCache,
} from './bayer-tiles'

describe('thresholdToLevel', () => {
  it('maps threshold 0 to level 0 for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 0)).toBe(0)
  })

  it('maps threshold 1 to max level for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 1)).toBe(16)
  })

  it('maps threshold 0.5 to level 8 for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 0.5)).toBe(8)
  })

  it('maps threshold 0 to level 0 for bayer2x2', () => {
    expect(thresholdToLevel('bayer2x2', 0)).toBe(0)
  })

  it('maps threshold 1 to level 4 for bayer2x2', () => {
    expect(thresholdToLevel('bayer2x2', 1)).toBe(4)
  })

  it('maps threshold 1 to level 64 for bayer8x8', () => {
    expect(thresholdToLevel('bayer8x8', 1)).toBe(64)
  })

  it('clamps threshold below 0', () => {
    expect(thresholdToLevel('bayer4x4', -0.5)).toBe(0)
  })

  it('clamps threshold above 1', () => {
    expect(thresholdToLevel('bayer4x4', 1.5)).toBe(16)
  })
})

describe('TILE_BITS', () => {
  it('has 5 entries for bayer2x2 (levels 0-4)', () => {
    for (let i = 0; i <= 4; i++) {
      expect(TILE_BITS.has('bayer2x2_' + i)).toBe(true)
    }
  })

  it('has 17 entries for bayer4x4 (levels 0-16)', () => {
    for (let i = 0; i <= 16; i++) {
      expect(TILE_BITS.has('bayer4x4_' + i)).toBe(true)
    }
  })

  it('has 65 entries for bayer8x8 (levels 0-64)', () => {
    for (let i = 0; i <= 64; i++) {
      expect(TILE_BITS.has('bayer8x8_' + i)).toBe(true)
    }
  })

  it('level 0 has all bits off (no pixels on)', () => {
    expect(TILE_BITS.get('bayer4x4_0')).toBe(0)
  })

  it('level 16 has all bits on for bayer4x4', () => {
    expect(TILE_BITS.get('bayer4x4_16')).toBe(0xFFFF)
  })

  it('level 4 has all bits on for bayer2x2', () => {
    expect(TILE_BITS.get('bayer2x2_4')).toBe(0xF)
  })

  it('each level has exactly N pixels on for bayer4x4', () => {
    for (let level = 0; level <= 16; level++) {
      const bits = TILE_BITS.get('bayer4x4_' + level)!
      let count = 0
      for (let i = 0; i < 16; i++) {
        if ((bits >> i) & 1) count++
      }
      expect(count).toBe(level)
    }
  })

  it('each level is a superset of the previous level', () => {
    for (let level = 1; level <= 16; level++) {
      const prev = TILE_BITS.get('bayer4x4_' + (level - 1))!
      const curr = TILE_BITS.get('bayer4x4_' + level)!
      expect(prev & curr).toBe(prev)
    }
  })
})

describe('getTileBits', () => {
  it('returns bits for bayer4x4 at threshold 0.5', () => {
    const bits = getTileBits('bayer4x4', 0.5)
    let count = 0
    for (let i = 0; i < 16; i++) {
      if ((bits >> i) & 1) count++
    }
    expect(count).toBe(8)
  })
})

describe('getTileDataURL', () => {
  it('returns a data URL string', () => {
    const url = getTileDataURL('bayer4x4', 0.5)
    expect(url).toMatch(/^data:image\/png;base64,/)
  })

  it('returns the same string for the same inputs (cached)', () => {
    clearTileCache()
    const url1 = getTileDataURL('bayer4x4', 0.5)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url1).toBe(url2)
  })

  it('returns different URLs for different thresholds', () => {
    const url1 = getTileDataURL('bayer4x4', 0.0)
    const url2 = getTileDataURL('bayer4x4', 1.0)
    expect(url1).not.toBe(url2)
  })

  it('returns different URLs for different algorithms', () => {
    const url1 = getTileDataURL('bayer2x2', 0.5)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url1).not.toBe(url2)
  })
})

describe('getTileSize', () => {
  it('returns 2 for bayer2x2', () => {
    expect(getTileSize('bayer2x2')).toBe(2)
  })

  it('returns 4 for bayer4x4', () => {
    expect(getTileSize('bayer4x4')).toBe(4)
  })

  it('returns 8 for bayer8x8', () => {
    expect(getTileSize('bayer8x8')).toBe(8)
  })
})

describe('clearTileCache', () => {
  it('clears cached data URLs', () => {
    const url1 = getTileDataURL('bayer4x4', 0.5)
    clearTileCache()
    // After clearing, calling again should regenerate (still returns same pattern)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url2).toMatch(/^data:image\/png;base64,/)
  })
})
