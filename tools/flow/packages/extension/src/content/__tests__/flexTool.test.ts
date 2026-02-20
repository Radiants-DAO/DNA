import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createLayoutTool } from '../modes/tools/layoutTool'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('LayoutTool', () => {
  let engine: UnifiedMutationEngine
  let shadowRoot: ShadowRoot
  let target: HTMLElement
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
    onUpdate = vi.fn()

    // Create a closed shadow root for the tool to render into
    const host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a target element with display: flex and children
    target = document.createElement('div')
    target.style.display = 'flex'
    target.style.justifyContent = 'flex-start'
    target.style.alignItems = 'stretch'
    target.style.flexDirection = 'row'
    target.style.flexWrap = 'nowrap'
    document.body.appendChild(target)

    const child = document.createElement('div')
    child.textContent = 'child'
    target.appendChild(child)
  })

  it('creates without errors', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('attaches and shows panel', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const container = shadowRoot.querySelector('.flow-layout')! as HTMLElement
    expect(container.style.display).not.toBe('none')
  })

  it('detaches and hides panel', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const container = shadowRoot.querySelector('.flow-layout')! as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('destroys and removes container', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    expect(shadowRoot.querySelector('.flow-layout')).toBeNull()
  })

  // Direction-aware grid navigation (row mode):
  // ←→ = justify (main axis), ↑↓ = align (cross axis)

  it('Right arrow moves justify-content forward in row mode', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('justify-content')
    // flex-start → center
    expect(diffs[0].changes[0].newValue).toBe('center')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Left arrow at flex-start is a no-op (already at grid edge)', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      })
    )

    // flex-start is already at min position — clamped, no change produced
    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(0)
  })

  it('Down arrow moves align-items forward in row mode', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('align-items')
    // stretch is not in positional grid, resets to flex-start
    expect(diffs[0].changes[0].newValue).toBe('flex-start')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Up arrow moves align-items backward in row mode', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('align-items')
    // stretch is not in positional grid, resets to flex-start
    expect(diffs[0].changes[0].newValue).toBe('flex-start')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Cmd+Up toggles flex-direction between row and column', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('flex-direction')
    expect(diffs[0].changes[0].newValue).toBe('column')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('does nothing when no target attached', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      })
    )

    expect(engine.getDiffs().length).toBe(0)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('supports undo', () => {
    const tool = createLayoutTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      })
    )

    expect(engine.canUndo).toBe(true)

    engine.undo()
    expect(engine.getDiffs().length).toBe(0)
  })
})
