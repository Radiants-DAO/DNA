import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEffectsTool } from '../modes/tools/effectsTool'
import { createToolTestContext } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/effectsTool.css?inline', () => ({ default: '' }))

// Mock toolPanelHeader
vi.mock('../modes/tools/toolPanelHeader', () => ({
  createToolPanelHeader: () => ({
    header: document.createElement('div'),
    destroy: vi.fn(),
  }),
}))

// Mock boxShadowParser
vi.mock('../../panel/components/designer/boxShadowParser', () => ({
  parseBoxShadow: () => [],
  stringifyBoxShadow: (shadows: any[]) =>
    shadows.map((s: any) => `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`).join(', '),
}))

vi.mock('../modes/tools/colorTokens', () => ({
  BLEND_MODES: ['normal', 'multiply', 'screen'],
}))

vi.mock('../modes/tools/toolPanelPosition', () => ({
  computeToolPanelPosition: () => ({ left: 100, top: 100 }),
}))

describe('EffectsTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>

  beforeEach(() => {
    ctx = createToolTestContext({ opacity: '1' })
  })

  it('creates with attach/detach/destroy', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('shows container on attach', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const container = ctx.shadowRoot.querySelector('.flow-effects') as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('hides container on detach', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.detach()

    const container = ctx.shadowRoot.querySelector('.flow-effects') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('removes container on destroy', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-effects')).toBeNull()
  })

  it('renders opacity slider', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const sliders = ctx.shadowRoot.querySelectorAll('.flow-fx-slider')
    expect(sliders.length).toBeGreaterThan(0)
  })

  it('renders blend mode dropdown', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const select = ctx.shadowRoot.querySelector('.flow-fx-select') as HTMLSelectElement
    expect(select).not.toBeNull()
    expect(select.options.length).toBeGreaterThan(0)
  })

  it('renders collapsible sections', () => {
    const tool = createEffectsTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
    tool.attach(ctx.target)

    const sections = ctx.shadowRoot.querySelectorAll('.flow-fx-section')
    // Drop Shadow, Backdrop Filter, Filter
    expect(sections.length).toBe(3)
  })
})
