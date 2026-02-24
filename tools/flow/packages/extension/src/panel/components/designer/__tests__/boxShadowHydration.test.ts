import { describe, it, expect } from 'vitest'
import { parseBoxShadow } from '../boxShadowParser'
import { createShadow, createEmptyLayers } from '../../../utils/layersValue'
import type { LayersValue, ShadowValue } from '../../../types/styleValue'

/**
 * Tests for BoxShadowsSection hydration logic:
 * parseBoxShadow() → createShadow() → LayersValue
 *
 * Exercises the bridge between the CSS parser and the
 * LayersValue type used by ShadowEditor.
 */

function parseCssColorToRgba(color: string): { r: number; g: number; b: number; alpha: number } {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], alpha: m[4] !== undefined ? +m[4] : 1 }
  return { r: 0, g: 0, b: 0, alpha: 0.1 }
}

function hydrate(css: string): LayersValue {
  const parsed = parseBoxShadow(css)
  if (parsed.length === 0) return createEmptyLayers()
  const shadows: ShadowValue[] = parsed.map(s =>
    createShadow({
      offsetX: s.offsetX,
      offsetY: s.offsetY,
      blur: s.blur,
      spread: s.spread,
      color: parseCssColorToRgba(s.color),
      inset: s.inset,
    })
  )
  return { type: 'layers', value: shadows }
}

describe('boxShadow hydration: parseBoxShadow → createShadow → LayersValue', () => {
  it('hydrates a simple shadow', () => {
    const layers = hydrate('2px 4px 6px rgba(0, 0, 0, 0.5)')
    expect(layers.type).toBe('layers')
    expect(layers.value).toHaveLength(1)

    const s = layers.value[0] as ShadowValue
    expect(s.type).toBe('shadow')
    expect(s.position).toBe('outset')
    expect(s.offsetX).toEqual({ type: 'unit', unit: 'px', value: 2 })
    expect(s.offsetY).toEqual({ type: 'unit', unit: 'px', value: 4 })
    expect(s.blur).toEqual({ type: 'unit', unit: 'px', value: 6 })
  })

  it('hydrates an inset shadow', () => {
    const layers = hydrate('inset 0 2px 4px rgba(0, 0, 0, 0.3)')
    const s = layers.value[0] as ShadowValue
    expect(s.position).toBe('inset')
  })

  it('hydrates multiple shadows', () => {
    const layers = hydrate('0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.2)')
    expect(layers.value).toHaveLength(2)
  })

  it('returns empty layers for "none"', () => {
    const layers = hydrate('none')
    expect(layers.value).toHaveLength(0)
  })

  it('returns empty layers for empty string', () => {
    const layers = hydrate('')
    expect(layers.value).toHaveLength(0)
  })

  it('color parsing falls back for non-rgba colors', () => {
    // "black" won't match the regex — falls back to default
    const layers = hydrate('2px 4px 6px black')
    const s = layers.value[0] as ShadowValue
    expect(s.color).toBeDefined()
    // Falls back to {r:0, g:0, b:0, alpha:0.1} via parseCssColorToRgba
    // createShadow produces a ColorValue with alpha
    expect(s.color).toHaveProperty('alpha', 0.1)
  })
})
