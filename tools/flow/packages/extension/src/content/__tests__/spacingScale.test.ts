import { describe, it, expect } from 'vitest'
import {
  findNearestTwIndex,
  stepTailwind,
  pxToDisplayValue,
  TAILWIND_SPACING,
} from '../modes/tools/spacingScale'

describe('spacingScale', () => {
  describe('findNearestTwIndex', () => {
    it('returns 0 for 0px', () => {
      expect(findNearestTwIndex(0)).toBe(0)
    })

    it('finds exact match for 16px (tw-4)', () => {
      const idx = findNearestTwIndex(16)
      expect(TAILWIND_SPACING[idx].px).toBe(16)
    })

    it('snaps 15px to nearest (14 or 16)', () => {
      const idx = findNearestTwIndex(15)
      expect([14, 16]).toContain(TAILWIND_SPACING[idx].px)
    })

    it('snaps 100px to nearest (96)', () => {
      const idx = findNearestTwIndex(100)
      expect(TAILWIND_SPACING[idx].px).toBe(96)
    })
  })

  describe('stepTailwind', () => {
    it('steps forward by 1', () => {
      const result = stepTailwind(8, 1, false)
      expect(result).toBe(10) // tw-2 (8) → tw-2.5 (10)
    })

    it('steps backward by 1', () => {
      const result = stepTailwind(8, -1, false)
      expect(result).toBe(6) // tw-2 (8) → tw-1.5 (6)
    })

    it('large step forward jumps 3', () => {
      const result = stepTailwind(0, 1, true)
      expect(result).toBe(4) // tw-0 (0) → 3 steps → tw-1 (4)
    })

    it('clamps at 0', () => {
      expect(stepTailwind(0, -1, false)).toBe(0)
    })

    it('clamps at max', () => {
      const max = TAILWIND_SPACING[TAILWIND_SPACING.length - 1].px
      expect(stepTailwind(max, 1, false)).toBe(max)
    })
  })

  describe('pxToDisplayValue', () => {
    it('returns tw label for exact match', () => {
      expect(pxToDisplayValue(16)).toBe('4')
    })

    it('returns tw "px" label for 1px', () => {
      expect(pxToDisplayValue(1)).toBe('px')
    })

    it('returns rounded number for non-scale values', () => {
      expect(pxToDisplayValue(15)).toBe('15')
    })
  })
})
