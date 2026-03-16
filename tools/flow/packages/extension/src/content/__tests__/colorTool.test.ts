import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createColorTool } from '../modes/tools/colorTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

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
    { name: '--color-page', value: '#ffffff', resolvedHex: '#ffffff', tier: 'semantic' as const },
    { name: '--color-inv', value: '#f0f0f0', resolvedHex: '#f0f0f0', tier: 'semantic' as const },
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
  let activeTool: ReturnType<typeof createColorTool> | null
  let getContextMock: { mockRestore: () => void }

  beforeEach(() => {
    ctx = createToolTestContext({ backgroundColor: 'red' })
    activeTool = null
    getContextMock = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => ({ fillStyle: '#ff0000' } as unknown as CanvasRenderingContext2D))
  })

  afterEach(() => {
    activeTool?.destroy()
    activeTool = null
    getContextMock.mockRestore()
    document.body.innerHTML = ''
  })

  function createTool() {
    activeTool = createColorTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    return activeTool
  }

  it('creates with attach/detach/destroy', () => {
    const tool = createTool()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const tool = createTool()
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-color-picker') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const tool = createTool()
    tool.attach(ctx.target)
    tool.destroy()
    activeTool = null

    expect(ctx.shadowRoot.querySelector('.flow-color-picker')).toBeNull()
  })

  it('renders 3 tab buttons (text/fill/border)', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const tabs = ctx.shadowRoot.querySelectorAll('.flow-color-tab')
    expect(tabs.length).toBe(3)
  })

  it('[ and ] keys cycle tabs', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const tabs = Array.from(ctx.shadowRoot.querySelectorAll('.flow-color-tab')) as HTMLButtonElement[]
    const activeBefore = tabs.findIndex(tab => tab.classList.contains('active'))
    expect(activeBefore).toBeGreaterThanOrEqual(0)

    dispatchKey(']')
    const activeAfterForward = tabs.findIndex(tab => tab.classList.contains('active'))
    expect(activeAfterForward).toBe((activeBefore + 1) % tabs.length)

    dispatchKey('[')
    const activeAfterBackward = tabs.findIndex(tab => tab.classList.contains('active'))
    expect(activeAfterBackward).toBe(activeBefore)
  })

  it('renders color token list with groups', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const items = ctx.shadowRoot.querySelectorAll('.flow-color-item')
    expect(items.length).toBeGreaterThan(0)
  })
})
