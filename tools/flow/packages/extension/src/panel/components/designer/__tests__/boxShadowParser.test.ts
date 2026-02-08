import { describe, it, expect } from 'vitest'
import { parseBoxShadow, stringifyBoxShadow } from '../boxShadowParser'

describe('parseBoxShadow', () => {
  it('should parse a simple shadow', () => {
    const result = parseBoxShadow('2px 4px 6px rgba(0,0,0,0.5)')
    expect(result).toHaveLength(1)
    expect(result[0].offsetX).toBe(2)
    expect(result[0].offsetY).toBe(4)
    expect(result[0].blur).toBe(6)
    expect(result[0].spread).toBe(0)
    expect(result[0].color).toBe('rgba(0,0,0,0.5)')
    expect(result[0].inset).toBe(false)
  })

  it('should parse shadow with spread', () => {
    const result = parseBoxShadow('2px 4px 6px 8px black')
    expect(result[0].spread).toBe(8)
    expect(result[0].color).toBe('black')
  })

  it('should parse inset shadow at start', () => {
    const result = parseBoxShadow('inset 2px 4px 6px black')
    expect(result[0].inset).toBe(true)
    expect(result[0].offsetX).toBe(2)
  })

  it('should parse inset shadow at end', () => {
    const result = parseBoxShadow('2px 4px 6px black inset')
    expect(result[0].inset).toBe(true)
  })

  it('should parse multiple shadows', () => {
    const result = parseBoxShadow('2px 2px 4px black, inset 0 0 10px white')
    expect(result).toHaveLength(2)
    expect(result[0].inset).toBe(false)
    expect(result[1].inset).toBe(true)
  })

  it('should handle rgb/rgba colors with commas', () => {
    const result = parseBoxShadow('2px 4px 6px rgb(255, 0, 0)')
    expect(result).toHaveLength(1)
    expect(result[0].color).toBe('rgb(255, 0, 0)')
  })

  it('should handle hsl colors', () => {
    const result = parseBoxShadow('2px 4px 6px hsl(120, 100%, 50%)')
    expect(result).toHaveLength(1)
    expect(result[0].color).toContain('hsl')
  })

  it('should return empty array for none', () => {
    expect(parseBoxShadow('none')).toEqual([])
    expect(parseBoxShadow('')).toEqual([])
  })

  it('should handle zero values without units', () => {
    const result = parseBoxShadow('0 0 10px black')
    expect(result[0].offsetX).toBe(0)
    expect(result[0].offsetY).toBe(0)
    expect(result[0].blur).toBe(10)
  })

  it('should handle negative offsets', () => {
    const result = parseBoxShadow('-2px -4px 6px black')
    expect(result[0].offsetX).toBe(-2)
    expect(result[0].offsetY).toBe(-4)
  })

  it('should handle multiple shadows with color functions', () => {
    const result = parseBoxShadow(
      '2px 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.5)'
    )
    expect(result).toHaveLength(2)
    expect(result[0].color).toBe('rgba(0, 0, 0, 0.3)')
    expect(result[1].color).toBe('rgba(255, 255, 255, 0.5)')
  })
})

describe('stringifyBoxShadow', () => {
  it('should return none for empty array', () => {
    expect(stringifyBoxShadow([])).toBe('none')
  })

  it('should stringify a simple shadow', () => {
    const result = stringifyBoxShadow([
      { offsetX: 2, offsetY: 4, blur: 6, spread: 0, color: 'black', inset: false },
    ])
    expect(result).toBe('2px 4px 6px 0px black')
  })

  it('should stringify inset shadow', () => {
    const result = stringifyBoxShadow([
      { offsetX: 0, offsetY: 0, blur: 10, spread: 0, color: 'white', inset: true },
    ])
    expect(result).toBe('inset 0px 0px 10px 0px white')
  })

  it('should roundtrip parse → stringify', () => {
    const input = '2px 4px 6px 8px rgba(0,0,0,0.5)'
    const parsed = parseBoxShadow(input)
    const output = stringifyBoxShadow(parsed)
    expect(output).toBe('2px 4px 6px 8px rgba(0,0,0,0.5)')
  })
})
