import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createGuidesTool } from '../modes/tools/guidesTool'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock CSS imports
vi.mock('../modes/tools/guidesTool.css?inline', () => ({ default: '' }))
vi.mock('../modes/tools/inspectRuler.css?inline', () => ({ default: '' }))

// Mock inspectRuler
const mockRuler = {
  setAnchor: vi.fn(),
  measureTo: vi.fn(),
  clearLines: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn(),
}
vi.mock('../modes/tools/inspectRuler', () => ({
  createInspectRuler: () => mockRuler,
}))

// Mock distanceOverlay (dependency of inspectRuler)
vi.mock('../../measurements/distanceOverlay', () => ({
  createDistanceOverlay: () => document.createElement('div'),
  createMeasurementLine: () => document.createElement('div'),
}))

describe('GuidesTool', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
    vi.clearAllMocks()
  })

  it('creates with activate/deactivate/destroy', () => {
    const tool = createGuidesTool({ shadowRoot })
    expect(tool.activate).toBeInstanceOf(Function)
    expect(tool.deactivate).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('activate does not add guide lines until selection', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()
    const guides = shadowRoot.querySelectorAll('.flow-guide-line')
    expect(guides.length).toBe(0)
  })

  it('onSelect renders 4 crosshair guide lines (top, right, bottom, left)', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tool.onSelect(el)

    const guides = shadowRoot.querySelectorAll('.flow-guide-line')
    expect(guides.length).toBe(4)

    // Verify horizontal + vertical lines are present
    const horizontal = shadowRoot.querySelectorAll('.flow-guide-line--horizontal')
    const vertical = shadowRoot.querySelectorAll('.flow-guide-line--vertical')
    expect(horizontal.length).toBe(2) // top + bottom edges
    expect(vertical.length).toBe(2)   // left + right edges
  })

  it('onSelect renders anchor badge with dimensions', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tool.onSelect(el)

    const badge = shadowRoot.querySelector('.flow-guide-anchor-badge')
    expect(badge).not.toBeNull()
    expect(badge!.textContent).toContain('200')
    expect(badge!.textContent).toContain('50')
  })

  it('onHover calls ruler.measureTo when anchor is set', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const anchor = createTargetElement('div')
    anchor.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100)
    tool.onSelect(anchor)

    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(200, 0, 100, 100)
    tool.onHover(target)

    expect(mockRuler.measureTo).toHaveBeenCalledWith(target)
  })

  it('onHover does nothing without anchor', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const target = createTargetElement('div')
    tool.onHover(target)

    expect(mockRuler.measureTo).not.toHaveBeenCalled()
  })

  it('deactivate clears all guide lines and badge', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.activate()

    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tool.onSelect(el)
    expect(shadowRoot.querySelectorAll('.flow-guide-line').length).toBe(4)

    tool.deactivate()

    expect(shadowRoot.querySelectorAll('.flow-guide-line').length).toBe(0)
    expect(shadowRoot.querySelectorAll('.flow-guide-anchor-badge').length).toBe(0)
    expect(mockRuler.clear).toHaveBeenCalled()
  })

  it('destroy removes container and style elements', () => {
    const tool = createGuidesTool({ shadowRoot })
    tool.destroy()
    expect(shadowRoot.querySelectorAll('.flow-guides-container').length).toBe(0)
    expect(mockRuler.destroy).toHaveBeenCalled()
  })
})
