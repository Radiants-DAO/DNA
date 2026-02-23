import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeToolPanelPosition } from '../modes/tools/toolPanelPosition'

// toolPanelPosition imports getPersistentSelectionSelectors — mock it
vi.mock('../overlays/persistentSelections', () => ({
  getPersistentSelectionSelectors: () => [],
}))

describe('computeToolPanelPosition', () => {
  beforeEach(() => {
    // Set viewport size
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  function mockElement(rect: DOMRect): Element {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => rect
    document.body.appendChild(el)
    return el
  }

  it('positions below element by default', () => {
    const el = mockElement(new DOMRect(100, 100, 200, 50))
    const pos = computeToolPanelPosition(el, 260, 400)
    // Below: top = rect.bottom + 8 = 158
    expect(pos.top).toBe(158)
    expect(pos.left).toBe(100)
  })

  it('clamps to viewport bounds', () => {
    // Element near bottom-right corner
    const el = mockElement(new DOMRect(900, 700, 100, 30))
    const pos = computeToolPanelPosition(el, 260, 400)
    // Should be clamped within viewport
    expect(pos.left).toBeLessThanOrEqual(1024 - 260 - 8)
    expect(pos.top).toBeLessThanOrEqual(768 - 400 - 8)
    expect(pos.left).toBeGreaterThanOrEqual(8)
    expect(pos.top).toBeGreaterThanOrEqual(8)
  })

  it('returns an object with left and top', () => {
    const el = mockElement(new DOMRect(200, 200, 100, 50))
    const pos = computeToolPanelPosition(el, 260, 400)
    expect(pos).toHaveProperty('left')
    expect(pos).toHaveProperty('top')
    expect(typeof pos.left).toBe('number')
    expect(typeof pos.top).toBe('number')
  })
})
