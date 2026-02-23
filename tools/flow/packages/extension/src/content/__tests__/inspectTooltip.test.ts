import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectTooltip } from '../modes/tools/inspectTooltip'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock the CSS import
vi.mock('../modes/tools/inspectTooltip.css?inline', () => ({ default: '' }))

// Mock accessibility functions (they need canvas)
vi.mock('../features/accessibility', () => ({
  getContrastRatio: () => 4.5,
  meetsWcagAA: () => true,
}))

describe('InspectTooltip', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
    // Set viewport for positioning
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  it('creates without errors', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    expect(tooltip).toBeDefined()
    expect(tooltip.show).toBeInstanceOf(Function)
    expect(tooltip.hide).toBeInstanceOf(Function)
    expect(tooltip.destroy).toBeInstanceOf(Function)
  })

  it('injects style element into shadow root', () => {
    createInspectTooltip({ shadowRoot })
    expect(shadowRoot.querySelector('style')).not.toBeNull()
  })

  it('show() makes tooltip visible with element info', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('div', { display: 'flex', color: 'red' })
    el.id = 'hero'
    el.classList.add('main-section')

    // Mock getBoundingClientRect for the target
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)

    tooltip.show(el, 200, 200)

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip).not.toBeNull()
    expect(tip.style.display).not.toBe('none')
    expect(tip.innerHTML).toContain('div')
    expect(tip.innerHTML).toContain('#hero')
  })

  it('hide() hides the tooltip', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('div')
    el.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    tooltip.show(el, 200, 200)
    tooltip.hide()

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip.style.display).toBe('none')
  })

  it('destroy() removes tooltip and style from shadow root', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    tooltip.destroy()

    expect(shadowRoot.querySelector('.flow-inspect-tip')).toBeNull()
    expect(shadowRoot.querySelectorAll('style').length).toBe(0)
  })

  it('shows dimensions in header', () => {
    const tooltip = createInspectTooltip({ shadowRoot })
    const el = createTargetElement('p')
    el.getBoundingClientRect = () => new DOMRect(0, 0, 300, 40)
    tooltip.show(el, 100, 100)

    const tip = shadowRoot.querySelector('.flow-inspect-tip') as HTMLElement
    expect(tip.innerHTML).toContain('300\u00d740')
  })
})
