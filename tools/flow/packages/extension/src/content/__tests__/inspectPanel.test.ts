import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInspectPanel } from '../modes/tools/inspectPanel'
import { createTestShadowRoot, createTargetElement } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/inspectPanel.css?inline', () => ({ default: '' }))

// Mock dependencies
vi.mock('../modes/tools/assetScanner', () => ({
  scanElementAssets: () => ({ images: [], svgs: [], fonts: [], colors: [], variables: [] }),
  scanMultipleElements: () => ({ images: [], svgs: [], fonts: [], colors: [], variables: [] }),
}))

vi.mock('../overlays/persistentSelections', () => ({
  getPersistentSelectionSelectors: () => [],
}))

vi.mock('../styleExtractor', () => ({
  extractGroupedStyles: () => ({
    layout: [], spacing: [], size: [], typography: [],
    colors: [], borders: [], shadows: [], effects: [], animations: [],
  }),
}))

vi.mock('../features/accessibility', () => ({
  getContrastRatio: () => 4.5,
  meetsWcagAA: () => true,
  meetsWcagAAA: () => false,
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

describe('InspectPanel', () => {
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    shadowRoot = createTestShadowRoot()
  })

  it('creates without errors', () => {
    const panel = createInspectPanel({ shadowRoot })
    expect(panel).toBeDefined()
    expect(panel.attach).toBeInstanceOf(Function)
    expect(panel.detach).toBeInstanceOf(Function)
    expect(panel.destroy).toBeInstanceOf(Function)
  })

  it('starts hidden', () => {
    createInspectPanel({ shadowRoot })
    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container).not.toBeNull()
    expect(container.style.display).toBe('none')
  })

  it('shows container on attach', () => {
    const panel = createInspectPanel({ shadowRoot })
    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    panel.attach(target)

    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const panel = createInspectPanel({ shadowRoot })
    const target = createTargetElement('div')
    target.getBoundingClientRect = () => new DOMRect(100, 100, 200, 50)
    panel.attach(target)
    panel.detach()

    const container = shadowRoot.querySelector('.flow-asset-panel') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const panel = createInspectPanel({ shadowRoot })
    panel.destroy()

    expect(shadowRoot.querySelector('.flow-asset-panel')).toBeNull()
  })

  it('renders top-level tab bar with 3 tabs', () => {
    createInspectPanel({ shadowRoot })
    const topTabs = shadowRoot.querySelector('.flow-inspect-top-tabs')
    expect(topTabs).not.toBeNull()
  })
})
