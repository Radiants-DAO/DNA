/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { renderGradientDither, renderGradientToDataURL, renderGradientToObjectURL } from './render'
import type { ResolvedGradient } from './types'

function makeGradient(): ResolvedGradient {
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
  }
}

describe('renderGradientDither in node', () => {
  it('renders without DOM globals', () => {
    expect(globalThis.document).toBeUndefined()
    expect(globalThis.ImageData).toBeUndefined()

    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 8,
      height: 8,
    })

    expect(result.width).toBe(8)
    expect(result.height).toBe(8)
    expect(result.data).toBeInstanceOf(Uint8ClampedArray)
    expect(result.data.length).toBe(8 * 8 * 4)
  })

  it('throws a descriptive error for renderGradientToDataURL without DOM globals', () => {
    expect(() =>
      renderGradientToDataURL({
        gradient: makeGradient(),
        algorithm: 'bayer4x4',
        width: 8,
        height: 8,
      })
    ).toThrow('renderGradientToDataURL requires browser-like DOM canvas APIs')
  })

  it('throws a descriptive error for renderGradientToObjectURL without DOM globals', () => {
    expect(() =>
      renderGradientToObjectURL(
        {
          gradient: makeGradient(),
          algorithm: 'bayer4x4',
          width: 8,
          height: 8,
        },
        () => {}
      )
    ).toThrow('renderGradientToObjectURL requires browser-like DOM canvas APIs')
  })
})
