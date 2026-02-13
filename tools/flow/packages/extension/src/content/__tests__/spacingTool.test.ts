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

    // Create a shadow root for the tool to render into
    host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a target element with known spacing
    target = document.createElement('div')
    target.style.marginTop = '10px'
    target.style.marginRight = '10px'
    target.style.marginBottom = '10px'
    target.style.marginLeft = '10px'
    target.style.paddingTop = '4px'
    target.style.paddingRight = '4px'
    target.style.paddingBottom = '4px'
    target.style.paddingLeft = '4px'
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

  it('renders panel with 8 value inputs (4 margin + 4 padding) into shadow root', () => {
    createSpacingTool({ shadowRoot, engine, onUpdate })
    // Should have a style element and a panel container
    const panel = shadowRoot.querySelector('.flow-sp')
    expect(panel).toBeDefined()

    // 8 inputs total: 4 margin + 4 padding
    const inputs = shadowRoot.querySelectorAll('input.flow-sp-val')
    expect(inputs.length).toBe(8)

    // Verify data attributes
    const marginInputs = shadowRoot.querySelectorAll('input[data-type="margin"]')
    const paddingInputs = shadowRoot.querySelectorAll('input[data-type="padding"]')
    expect(marginInputs.length).toBe(4)
    expect(paddingInputs.length).toBe(4)
  })

  it('attaches to an element and shows the panel', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const panel = shadowRoot.querySelector('.flow-sp') as HTMLElement
    expect(panel.style.display).not.toBe('none')
  })

  it('detaches and hides the panel', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const panel = shadowRoot.querySelector('.flow-sp') as HTMLElement
    expect(panel.style.display).toBe('none')
  })

  it('destroys and removes all elements from shadow root', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    // Both style element and panel container should be removed
    expect(shadowRoot.children.length).toBe(0)
  })

  it('handles arrow key for padding adjustment using Tailwind scale', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Target padding-top is 4px (TW "1", index 3)
    // ArrowUp should step to next TW value: 6px (TW "1.5", index 4)
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    const diffs = engine.getDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].changes[0].property).toBe('padding-top')
    expect(diffs[0].changes[0].newValue).toBe('6px')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('handles Shift+Arrow for larger Tailwind scale jumps', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Target padding-bottom is 4px (TW "1", index 3)
    // Shift+ArrowDown = large step (3 positions): index 3 + 3 = 6 → 10px
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
    expect(diffs[0].changes[0].newValue).toBe('10px')
  })

  it('handles Alt+Arrow for margin instead of padding', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Target margin-left is 10px (TW "2.5", index 6)
    // Alt+ArrowLeft should step to next TW value: 12px (TW "3", index 7)
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

  it('records drag mutations when drag ends via window blur', () => {
    const tool = createSpacingTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const handle = shadowRoot.querySelector(
      '.flow-sp-handle[data-type="padding"][data-edge="top"]'
    ) as HTMLElement | null
    expect(handle).toBeTruthy()

    handle!.dispatchEvent(new MouseEvent('mousedown', {
      button: 0,
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 120,
    }))

    // Exceed drag threshold (3px) to enter dragging mode
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 140,
    }))

    window.dispatchEvent(new Event('blur'))

    const diffs = engine.getDiffs()
    expect(diffs).toHaveLength(1)
    expect(diffs[0].changes[0].property).toBe('padding-top')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('renders box model visualization with nested margin and padding areas', () => {
    createSpacingTool({ shadowRoot, engine, onUpdate })

    const marginArea = shadowRoot.querySelector('.flow-sp-margin-area')
    const paddingArea = shadowRoot.querySelector('.flow-sp-padding-area')
    const elementCenter = shadowRoot.querySelector('.flow-sp-element-center')

    expect(marginArea).toBeDefined()
    expect(paddingArea).toBeDefined()
    expect(elementCenter).toBeDefined()

    // Padding area should be nested inside margin area
    expect(marginArea!.contains(paddingArea!)).toBe(true)
    expect(paddingArea!.contains(elementCenter!)).toBe(true)
  })

  it('renders box-sizing toggle', () => {
    createSpacingTool({ shadowRoot, engine, onUpdate })

    const boxBtns = shadowRoot.querySelectorAll('.flow-sp-box-btn')
    expect(boxBtns.length).toBe(2)
  })
})
