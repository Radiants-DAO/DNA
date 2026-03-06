import { describe, it, expect } from 'vitest'
import { resolveStops, resolveGradient, findStopSegment } from './types'

describe('resolveStops', () => {
  it('auto-distributes 2 stops to 0 and 1', () => {
    const result = resolveStops([{ color: '#000' }, { color: '#fff' }])
    expect(result).toEqual([
      { color: '#000', position: 0 },
      { color: '#fff', position: 1 },
    ])
  })

  it('auto-distributes 3 stops evenly', () => {
    const result = resolveStops([{ color: '#f00' }, { color: '#0f0' }, { color: '#00f' }])
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(0.5)
    expect(result[2].position).toBe(1)
  })

  it('preserves explicit positions', () => {
    const result = resolveStops([
      { color: '#000', position: 0 },
      { color: '#fff', position: 0.3 },
    ])
    expect(result[1].position).toBe(0.3)
  })

  it('returns black-to-white for empty input', () => {
    const result = resolveStops([])
    expect(result.length).toBe(2)
  })

  it('duplicates single stop', () => {
    const result = resolveStops([{ color: '#f00' }])
    expect(result.length).toBe(2)
    expect(result[0].color).toBe('#f00')
    expect(result[1].color).toBe('#f00')
  })

  it('distributes auto positions between explicit anchors', () => {
    const result = resolveStops([
      { color: '#f00', position: 0 },
      { color: '#0f0' },
      { color: '#00f', position: 1 },
    ])
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(0.5)
    expect(result[2].position).toBe(1)
  })

  it('distributes 3+ consecutive auto stops evenly between anchors', () => {
    const result = resolveStops([
      { color: '#f00', position: 0 },
      { color: '#0f0' },
      { color: '#00f' },
      { color: '#ff0' },
      { color: '#fff', position: 1 },
    ])
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(0.25)
    expect(result[2].position).toBe(0.5)
    expect(result[3].position).toBe(0.75)
    expect(result[4].position).toBe(1)
  })

  it('handles mixed explicit and auto positions without non-monotonic output', () => {
    const result = resolveStops([
      { color: '#f00', position: 0.8 },
      { color: '#0f0' },
      { color: '#00f' },
    ])
    // All positions should be monotonically increasing
    for (let i = 1; i < result.length; i++) {
      expect(result[i].position).toBeGreaterThanOrEqual(result[i - 1].position)
    }
  })

  it('clamps out-of-range positions to [0, 1]', () => {
    const result = resolveStops([
      { color: '#f00', position: -0.5 },
      { color: '#00f', position: 1.5 },
    ])
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(1)
  })

  it('enforces monotonically increasing positions', () => {
    const result = resolveStops([
      { color: '#f00', position: 0.8 },
      { color: '#0f0', position: 0.2 },
      { color: '#00f', position: 1 },
    ])
    expect(result[0].position).toBe(0.8)
    expect(result[1].position).toBe(0.8) // clamped up to previous
    expect(result[2].position).toBe(1)
  })
})

describe('resolveGradient', () => {
  it('defaults to linear black-to-white at 90deg', () => {
    const g = resolveGradient(undefined, undefined, undefined)
    expect(g.type).toBe('linear')
    expect(g.angle).toBe(90)
    expect(g.stops.length).toBe(2)
  })

  it('resolves string shorthand', () => {
    const g = resolveGradient('radial', ['#f00', '#00f'], undefined)
    expect(g.type).toBe('radial')
    expect(g.stops[0].color).toBe('#f00')
  })

  it('resolves full gradient object', () => {
    const g = resolveGradient(
      { type: 'conic', stops: [{ color: '#f00' }, { color: '#00f' }], startAngle: 45 },
      undefined, undefined
    )
    expect(g.type).toBe('conic')
    expect(g.startAngle).toBe(45)
  })

  it('colors prop creates evenly-spaced stops', () => {
    const g = resolveGradient(undefined, ['#f00', '#0f0', '#00f'], undefined)
    expect(g.stops[1].position).toBe(0.5)
  })

  it('angle prop overrides gradient object angle', () => {
    const g = resolveGradient(undefined, undefined, 135)
    expect(g.angle).toBe(135)
  })
})

describe('findStopSegment', () => {
  const stops = [
    { color: '#f00', position: 0 },
    { color: '#0f0', position: 0.5 },
    { color: '#00f', position: 1 },
  ] as Required<{ color: string; position: number }>[]

  it('returns first segment for t=0.25', () => {
    const seg = findStopSegment(0.25, stops)
    expect(seg.colorA).toBe('#f00')
    expect(seg.colorB).toBe('#0f0')
    expect(seg.localT).toBe(0.5)
  })

  it('returns second segment for t=0.75', () => {
    const seg = findStopSegment(0.75, stops)
    expect(seg.colorA).toBe('#0f0')
    expect(seg.colorB).toBe('#00f')
    expect(seg.localT).toBe(0.5)
  })

  it('clamps t below 0', () => {
    const seg = findStopSegment(-0.5, stops)
    expect(seg.colorA).toBe('#f00')
    expect(seg.localT).toBe(0)
  })

  it('clamps t above 1', () => {
    const seg = findStopSegment(1.5, stops)
    expect(seg.colorB).toBe('#00f')
    expect(seg.localT).toBe(1)
  })

  it('handles exact stop boundary', () => {
    const seg = findStopSegment(0.5, stops)
    expect(seg.localT).toBe(1)
    expect(seg.colorB).toBe('#0f0')
  })
})
