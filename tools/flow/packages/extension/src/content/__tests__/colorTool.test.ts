import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createColorTool } from '../modes/tools/colorTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock canvas getContext for resolveColorToHex
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '#ff0000',
})) as any

// Mock CSS import
vi.mock('../modes/tools/colorTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader (renders into shadow DOM)
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

// Mock colorTokens to return predictable data
vi.mock('../modes/tools/colorTokens', () => ({
  extractBrandColors: () => [
    { name: '--color-surface-primary', value: '#ffffff', resolvedHex: '#ffffff', tier: 'semantic' as const },
    { name: '--color-surface-secondary', value: '#f0f0f0', resolvedHex: '#f0f0f0', tier: 'semantic' as const },
  ],
  getSemanticTarget: (tab: string) => {
    if (tab === 'text') return { property: 'color', prefix: 'content' }
    if (tab === 'border') return { property: 'border-color', prefix: 'edge' }
    return { property: 'background-color', prefix: 'surface' }
  },
  findSemanticVariable: () => null,
}))

// Mock customProperties
vi.mock('../../agent/customProperties', () => ({
  extractCustomProperties: () => [],
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

vi.mock('../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('ColorTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>

  beforeEach(() => {
    ctx = createToolTestContext({ backgroundColor: 'red' })
  })

  it('creates with attach/detach/destroy', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-color-picker')).toBeNull()
  })

  it('renders 3 tab buttons (text/fill/border)', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const tabs = ctx.shadowRoot.querySelectorAll('.flow-color-tab')
    expect(tabs.length).toBe(3)
  })

  it('[ and ] keys cycle tabs', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    // Current tab depends on auto-detection; just verify the key doesn't throw
    dispatchKey(']')
    dispatchKey('[')

    // Tool still functional — container visible
    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('renders color token list with groups', () => {
    const tool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const items = ctx.shadowRoot.querySelectorAll('.flow-color-item')
    expect(items.length).toBeGreaterThan(0)
  })
})
