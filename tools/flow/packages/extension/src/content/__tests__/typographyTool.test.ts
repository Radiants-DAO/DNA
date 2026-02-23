import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTypographyTool } from '../modes/tools/typographyTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/typographyTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

vi.mock('../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('TypographyTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>
  let activeTool: ReturnType<typeof createTypographyTool> | null
  let getContextMock: { mockRestore: () => void }

  beforeEach(() => {
    ctx = createToolTestContext({
      fontSize: '16px',
      fontWeight: '400',
      fontFamily: 'Inter',
      lineHeight: '1.5',
      color: 'rgb(0, 0, 0)',
    })
    activeTool = null
    getContextMock = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => ({ fillStyle: '#000000' } as unknown as CanvasRenderingContext2D))
  })

  afterEach(() => {
    activeTool?.destroy()
    activeTool = null
    getContextMock.mockRestore()
    document.body.innerHTML = ''
  })

  function createTool() {
    activeTool = createTypographyTool({
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

    const container = ctx.shadowRoot.querySelector('.flow-typography') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides on detach', () => {
    const tool = createTool()
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-typography') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes on destroy', () => {
    const tool = createTool()
    tool.attach(ctx.target)
    tool.destroy()
    activeTool = null

    expect(ctx.shadowRoot.querySelector('.flow-typography')).toBeNull()
  })

  it('ArrowUp increases font-size by 1px', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    dispatchKey('ArrowUp')

    const diffs = ctx.engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes.some(c => c.property === 'font-size')).toBe(true)
    expect(ctx.onUpdate).toHaveBeenCalled()
  })

  it('Shift+ArrowUp increases font-size by 10px', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    dispatchKey('ArrowUp', { shiftKey: true })

    const diffs = ctx.engine.getDiffs()
    expect(diffs.length).toBe(1)
    const fontSizeChange = diffs[0].changes.find(c => c.property === 'font-size')
    expect(fontSizeChange).toBeDefined()
    // 16 + 10 = 26
    expect(fontSizeChange!.newValue).toBe('26px')
  })

  it('renders font family select', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const selects = ctx.shadowRoot.querySelectorAll('.flow-typo-select')
    expect(selects.length).toBeGreaterThanOrEqual(2) // font family + weight
  })

  it('renders text align toggle buttons', () => {
    const tool = createTool()
    tool.attach(ctx.target)

    const toggles = ctx.shadowRoot.querySelectorAll('.flow-typo-toggle-btn')
    // Font style (3) + Align (4) + Decoration (4) + Transform (4) = 15
    expect(toggles.length).toBe(15)
  })
})
