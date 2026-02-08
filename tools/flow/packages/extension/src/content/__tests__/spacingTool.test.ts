import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSpacingTool } from '../modes/tools/spacingTool'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('SpacingTool', () => {
  let engine: UnifiedMutationEngine
  let shadowRoot: ShadowRoot
  let host: HTMLElement
  let target: HTMLElement
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
    onUpdate = vi.fn()

    // Create a closed shadow root for the tool to render into
    host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a target element with known spacing
    target = document.createElement('div')
    target.style.marginTop = '10px'
    target.style.marginRight = '10px'
    target.style.marginBottom = '10px'
    target.style.marginLeft = '10px'
    target.style.paddingTop = '5px'
    target.style.paddingRight = '5px'
    target.style.paddingBottom = '5px'
    target.style.paddingLeft = '5px'
    document.body.appendChild(target)
  })

  afterEach(() => {
    host.remove()
    target.remove()
  })

  it('creates without errors', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('renders 8 handles (4 margin + 4 padding) into shadow root', () => {
    createSpacingTool({ shadowRoot, engine, onUpdate })
    // Container with 8 handles + 1 value label = 10 children
    const container = shadowRoot.querySelector('div')
    expect(container).toBeDefined()
    // 8 handles + 1 label div
    expect(container!.children.length).toBe(9)
  })

  it('attaches to an element and shows handles', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Check that handles are visible (display !== 'none')
    const container = shadowRoot.querySelector('div')!
    const handles = Array.from(container.querySelectorAll('div[data-type]'))
    // All 8 handles should be visible
    expect(handles.length).toBe(8)
    handles.forEach((h) => {
      expect((h as HTMLElement).style.display).toBe('block')
    })
  })

  it('detaches and hides all handles', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const container = shadowRoot.querySelector('div')!
    const handles = Array.from(container.querySelectorAll('div[data-type]'))
    handles.forEach((h) => {
      expect((h as HTMLElement).style.display).toBe('none')
    })
  })

  it('destroys and removes container from shadow root', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    // Container should be removed
    expect(shadowRoot.children.length).toBe(0)
  })

  it('handles arrow key for padding adjustment', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Simulate ArrowUp key (should adjust padding-top by 1px)
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    // The engine should have a diff
    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('padding-top')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('handles Shift+Arrow for 10px step', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('padding-bottom')
    // 5px original + 10px step = 15px
    expect(diffs[0].changes[0].newValue).toBe('15px')
  })

  it('handles Alt+Arrow for margin instead of padding', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('margin-left')
  })

  it('does nothing when no target is attached', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    expect(engine.getDiffs().length).toBe(0)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('supports undo after arrow key change', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Apply change
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    }))

    expect(engine.canUndo).toBe(true)

    // Undo
    engine.undo()
    expect(engine.getDiffs().length).toBe(0)
  })
})
