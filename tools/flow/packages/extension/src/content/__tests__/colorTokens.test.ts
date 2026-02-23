import { describe, it, expect } from 'vitest'
import { getSemanticTarget, hexToHue } from '../modes/tools/colorTokens'

describe('colorTokens', () => {
  describe('getSemanticTarget', () => {
    it('maps text tab to color + content prefix', () => {
      const result = getSemanticTarget('text')
      expect(result.property).toBe('color')
      expect(result.prefix).toBe('content')
    })

    it('maps fill tab to background-color + surface prefix', () => {
      const result = getSemanticTarget('fill')
      expect(result.property).toBe('background-color')
      expect(result.prefix).toBe('surface')
    })

    it('maps border tab to border-color + edge prefix', () => {
      const result = getSemanticTarget('border')
      expect(result.property).toBe('border-color')
      expect(result.prefix).toBe('edge')
    })
  })

  describe('hexToHue', () => {
    it('returns 0 for pure red (#ff0000)', () => {
      expect(hexToHue('#ff0000')).toBe(0)
    })

    it('returns ~120 for pure green (#00ff00)', () => {
      expect(hexToHue('#00ff00')).toBe(120)
    })

    it('returns ~240 for pure blue (#0000ff)', () => {
      expect(hexToHue('#0000ff')).toBe(240)
    })

    it('returns 0 for black (#000000)', () => {
      expect(hexToHue('#000000')).toBe(0)
    })

    it('returns 0 for white (#ffffff)', () => {
      expect(hexToHue('#ffffff')).toBe(0)
    })

    it('handles short hex (#f00)', () => {
      expect(hexToHue('#f00')).toBe(0)
    })
  })
})
