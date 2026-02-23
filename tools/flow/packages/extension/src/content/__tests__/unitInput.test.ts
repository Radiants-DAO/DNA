import { describe, it, expect } from 'vitest'
import { parseValueWithUnit, resolveInputWithUnit } from '../modes/tools/unitInput'

describe('parseValueWithUnit', () => {
  it('parses number only', () => {
    expect(parseValueWithUnit('16')).toEqual({ value: '16', unit: null })
  })

  it('parses number with px', () => {
    expect(parseValueWithUnit('16px')).toEqual({ value: '16', unit: 'px' })
  })

  it('parses decimal with rem', () => {
    expect(parseValueWithUnit('1.5rem')).toEqual({ value: '1.5', unit: 'rem' })
  })

  it('parses percent', () => {
    expect(parseValueWithUnit('100%')).toEqual({ value: '100', unit: '%' })
  })

  it('parses negative with ch', () => {
    expect(parseValueWithUnit('-3ch')).toEqual({ value: '-3', unit: 'ch' })
  })

  it('parses viewport units', () => {
    expect(parseValueWithUnit('80dvw')).toEqual({ value: '80', unit: 'dvw' })
  })

  it('returns keyword for auto', () => {
    expect(parseValueWithUnit('auto')).toEqual({ value: 'auto', unit: null })
  })

  it('returns keyword for normal', () => {
    expect(parseValueWithUnit('normal')).toEqual({ value: 'normal', unit: null })
  })

  it('returns empty for empty string', () => {
    expect(parseValueWithUnit('')).toEqual({ value: '', unit: null })
  })

  it('uses default unit when no unit provided', () => {
    expect(parseValueWithUnit('16', 'em')).toEqual({ value: '16', unit: 'em' })
  })
})

describe('resolveInputWithUnit', () => {
  function createInput(value: string): HTMLInputElement {
    const input = document.createElement('input')
    input.value = value
    return input
  }

  function createUnitSelect(units: string[], selected: string): HTMLSelectElement {
    const sel = document.createElement('select')
    for (const u of units) {
      const opt = document.createElement('option')
      opt.value = u
      opt.textContent = u
      sel.appendChild(opt)
    }
    sel.value = selected
    return sel
  }

  it('detects embedded unit and updates selector', () => {
    const input = createInput('16ch')
    const select = createUnitSelect(['px', 'em', 'rem', 'ch'], 'px')
    const result = resolveInputWithUnit(input, select, 'px')
    expect(result.value).toBe('16')
    expect(result.unit).toBe('ch')
    expect(result.changed).toBe(true)
    expect(input.value).toBe('16')
    expect(select.value).toBe('ch')
  })

  it('keeps current unit when no unit typed', () => {
    const input = createInput('24')
    const select = createUnitSelect(['px', 'em'], 'em')
    const result = resolveInputWithUnit(input, select)
    expect(result.value).toBe('24')
    expect(result.unit).toBe('em')
    expect(result.changed).toBe(false)
  })

  it('adds unknown unit to selector dynamically', () => {
    const input = createInput('80dvw')
    const select = createUnitSelect(['px', 'em'], 'px')
    const result = resolveInputWithUnit(input, select, 'px')
    expect(result.unit).toBe('dvw')
    expect(result.changed).toBe(true)
    expect(select.querySelector('option[value="dvw"]')).not.toBeNull()
  })

  it('passes through keywords', () => {
    const input = createInput('auto')
    const select = createUnitSelect(['px'], 'px')
    const result = resolveInputWithUnit(input, select)
    expect(result.value).toBe('auto')
    expect(input.value).toBe('auto')
  })
})
