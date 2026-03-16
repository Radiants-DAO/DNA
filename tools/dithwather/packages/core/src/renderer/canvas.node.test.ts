/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { renderToCanvas, renderToDataURL } from './canvas'

describe('renderToCanvas in node', () => {
  it('throws a descriptive error when browser canvas APIs are unavailable', () => {
    expect(() => renderToCanvas({}, { width: 4, height: 4 })).toThrow(
      'renderToCanvas requires browser-like canvas APIs'
    )
  })

  it('throws the same descriptive error for renderToDataURL', () => {
    expect(() => renderToDataURL({}, { width: 4, height: 4 })).toThrow(
      'renderToCanvas requires browser-like canvas APIs'
    )
  })

  it('throws a descriptive error when toDataURL is requested from an OffscreenCanvas without DOM fallbacks', () => {
    class OffscreenCanvasMock {
      width = 0
      height = 0

      getContext() {
        return {
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillStyle: '#000000',
          fillRect: () => {},
          getImageData: () => ({
            width: this.width,
            height: this.height,
            data: new Uint8ClampedArray(this.width * this.height * 4),
          }),
          putImageData: () => {},
        }
      }
    }

    globalThis.OffscreenCanvas = OffscreenCanvasMock as unknown as typeof OffscreenCanvas

    try {
      const result = renderToCanvas({}, { width: 4, height: 4 })
      expect(() => result.toDataURL()).toThrow(
        'renderToCanvas().toDataURL requires DOM canvas APIs when OffscreenCanvas is used'
      )
    } finally {
      delete (globalThis as { OffscreenCanvas?: typeof OffscreenCanvas }).OffscreenCanvas
    }
  })
})
