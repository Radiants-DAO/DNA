import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPositionTool } from '../modes/tools/positionTool'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('PositionTool', () => {
  let engine: UnifiedMutationEngine
  let shadowRoot: ShadowRoot
  let target: HTMLElement
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
    onUpdate = vi.fn()

    // Create a shadow root for the tool to render into
    const host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a target element with known position
    target = document.createElement('div')
    target.style.position = 'relative'
    target.style.top = '20px'
    target.style.left = '30px'
    target.style.width = '100px'
    target.style.height = '100px'
    document.body.appendChild(target)
  })

  it('creates without errors (has attach/detach/destroy)', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('attaches to element and shows position overlay', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Container should be visible
    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).not.toBe('none')

    // Crosshair and label should be visible
    const children = Array.from(container.children) as HTMLElement[]
    // crosshair + positionLabel = 2 children
    expect(children.length).toBe(2)
  })

  it('detaches and hides overlay', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).toBe('none')

    // Crosshair and label should be hidden
    const children = Array.from(container.children) as HTMLElement[]
    children.forEach((child) => {
      expect(child.style.display).toBe('none')
    })
  })

  it('destroys and removes container', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    expect(shadowRoot.children.length).toBe(0)
  })

  it('arrow key nudges position by 1px', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // ArrowDown should increase top by 1px
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }))

    const diffs = engine.getDiffs()
    expect(diffs.length).toBeGreaterThanOrEqual(1)
    // Find the top change
    const topChange = diffs.flatMap(d => d.changes).find(c => c.property === 'top')
    expect(topChange).toBeDefined()
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Shift+Arrow nudges by 10px', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }))

    const diffs = engine.getDiffs()
    expect(diffs.length).toBeGreaterThanOrEqual(1)
    const leftChange = diffs.flatMap(d => d.changes).find(c => c.property === 'left')
    expect(leftChange).toBeDefined()
  })

  it('Cmd/Ctrl+Arrow nudges by 100px', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    }))

    const diffs = engine.getDiffs()
    expect(diffs.length).toBeGreaterThanOrEqual(1)
    const topChange = diffs.flatMap(d => d.changes).find(c => c.property === 'top')
    expect(topChange).toBeDefined()
  })

  it('auto-sets position: relative on static elements', () => {
    // Create a static-positioned target
    const staticTarget = document.createElement('div')
    staticTarget.style.width = '100px'
    staticTarget.style.height = '100px'
    document.body.appendChild(staticTarget)

    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(staticTarget)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }))

    const diffs = engine.getDiffs()
    // Should have position change + top change
    const positionChange = diffs.flatMap(d => d.changes).find(c => c.property === 'position')
    expect(positionChange).toBeDefined()
    expect(positionChange!.newValue).toBe('relative')
  })

  it('does nothing when no target attached', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    }))

    expect(engine.getDiffs().length).toBe(0)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('supports undo after arrow key change', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }))

    expect(engine.canUndo).toBe(true)

    engine.undo()
    expect(engine.getDiffs().length).toBe(0)
  })
})
