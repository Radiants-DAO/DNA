import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectRuler } from '../modes/tools/inspectRuler'
import { createTestShadowRoot } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/inspectRuler.css?inline', () => ({ default: '' }))

// Mock distance overlay (creates DOM elements)
vi.mock('../measurements/distanceOverlay', () => ({
  createDistanceOverlay: (m: any) => {
    const el = document.createElement('div')
    el.className = 'mock-distance-overlay'
    el.textContent = `${m.d}px`
    return el
  },
  createMeasurementLine: (m: any) => {
    const el = document.createElement('div')
    el.className = 'mock-measurement-line'
    return el
  },
}))

describe('InspectRuler', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  function mockElement(rect: DOMRect): Element {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => rect
    document.body.appendChild(el)
    return el
  }

  it('creates without errors', () => {
    const ruler = createInspectRuler({ shadowRoot })
    expect(ruler).toBeDefined()
    expect(ruler.setAnchor).toBeInstanceOf(Function)
    expect(ruler.measureTo).toBeInstanceOf(Function)
    expect(ruler.clear).toBeInstanceOf(Function)
    expect(ruler.destroy).toBeInstanceOf(Function)
  })

  it('measureTo renders overlays when anchor is set', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    const target = mockElement(new DOMRect(150, 0, 100, 100))

    ruler.setAnchor(anchor)
    ruler.measureTo(target)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    // Should have created overlay elements for measurements
    expect(container.children.length).toBeGreaterThan(0)
  })

  it('measureTo clears overlays when measuring same element as anchor', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const el = mockElement(new DOMRect(0, 0, 100, 100))

    ruler.setAnchor(el)
    ruler.measureTo(el)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('clearLines removes measurement overlays', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    const target = mockElement(new DOMRect(150, 0, 100, 100))

    ruler.setAnchor(anchor)
    ruler.measureTo(target)
    ruler.clearLines()

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('clear resets anchor and removes overlays', () => {
    const ruler = createInspectRuler({ shadowRoot })
    const anchor = mockElement(new DOMRect(0, 0, 100, 100))
    ruler.setAnchor(anchor)
    ruler.clear()

    // After clear, measureTo with a different element should produce nothing
    // because anchor is null
    const target = mockElement(new DOMRect(200, 0, 50, 50))
    ruler.measureTo(target)

    const container = shadowRoot.querySelector('.flow-inspect-ruler')!
    expect(container.children.length).toBe(0)
  })

  it('destroy removes container and style', () => {
    const ruler = createInspectRuler({ shadowRoot })
    ruler.destroy()

    expect(shadowRoot.querySelector('.flow-inspect-ruler')).toBeNull()
  })
})
