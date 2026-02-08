import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlexTool } from '../modes/tools/flexTool'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('FlexTool', () => {
  let engine: UnifiedMutationEngine
  let shadowRoot: ShadowRoot
  let parent: HTMLElement
  let target: HTMLElement
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
    onUpdate = vi.fn()

    // Create a closed shadow root for the tool to render into
    const host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a parent with display: flex and a child target element
    parent = document.createElement('div')
    parent.style.display = 'flex'
    parent.style.justifyContent = 'flex-start'
    parent.style.alignItems = 'stretch'
    parent.style.flexDirection = 'row'
    parent.style.flexWrap = 'nowrap'
    document.body.appendChild(parent)

    target = document.createElement('div')
    target.textContent = 'child'
    parent.appendChild(target)
  })

  it('creates without errors', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('attaches and shows overlay', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).not.toBe('none')
    // Label should be visible
    const label = container.querySelector('div')!
    expect(label.style.display).toBe('block')
  })

  it('detaches and hides overlay', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).toBe('none')
  })

  it('destroys and removes container', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    expect(shadowRoot.children.length).toBe(0)
  })

  it('Up arrow cycles justify-content forward', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
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
    expect(diffs[0].changes[0].property).toBe('justify-content')
    expect(diffs[0].changes[0].newValue).toBe('center')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Down arrow cycles justify-content backward', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
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
    expect(diffs[0].changes[0].property).toBe('justify-content')
    // flex-start backward wraps to space-evenly
    expect(diffs[0].changes[0].newValue).toBe('space-evenly')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Right arrow cycles align-items forward', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
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
    expect(diffs[0].changes[0].property).toBe('align-items')
    // stretch → flex-start
    expect(diffs[0].changes[0].newValue).toBe('flex-start')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('Left arrow cycles align-items backward', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('align-items')
    // stretch backward wraps to baseline
    expect(diffs[0].changes[0].newValue).toBe('baseline')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('auto-sets display: flex on non-flex parent', () => {
    // Override parent to not be flex
    parent.style.display = 'block'

    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      })
    )

    const diffs = engine.getDiffs()
    // First diff: display: flex, second diff: justify-content change
    expect(diffs.length).toBe(2)
    expect(diffs[0].changes[0].property).toBe('display')
    expect(diffs[0].changes[0].newValue).toBe('flex')
  })

  it('Cmd+Up toggles flex-direction between row and column', () => {
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
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
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })

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
    const tool = createFlexTool({ shadowRoot, engine, onUpdate })
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
