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

  function dispatchKey(key: string, modifiers: Partial<Pick<KeyboardEvent, 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>> = {}) {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...modifiers,
      })
    )
  }

  it('creates without errors (has attach/detach/destroy)', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
  })

  it('attaches to element and shows floating panel', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    // Container (.flow-pos) should be visible
    const container = shadowRoot.querySelector('.flow-pos') as HTMLElement
    expect(container).toBeTruthy()
    expect(container.style.display).not.toBe('none')
  })

  it('detaches and hides floating panel', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.detach()

    const container = shadowRoot.querySelector('.flow-pos') as HTMLElement
    expect(container.style.display).toBe('none')
  })

  it('destroys and removes container + style elements', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)
    tool.destroy()

    expect(shadowRoot.querySelector('.flow-pos')).toBeNull()
    // The tool's own style is removed; shared toolPanelHeader style may persist
    const remainingStyles = shadowRoot.querySelectorAll('style:not([data-flow-tool-header-styles])')
    expect(remainingStyles.length).toBe(0)
  })

  it('renders position type dropdown with all types', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const trigger = shadowRoot.querySelector('.flow-pos-dropdown-trigger')
    expect(trigger).toBeTruthy()

    const items = shadowRoot.querySelectorAll('.flow-pos-dropdown-item')
    // 5 position types: static, relative, absolute, fixed, sticky
    expect(items.length).toBe(5)
  })

  it('shows current position type in dropdown on attach', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target) // target has position: relative

    const text = shadowRoot.querySelector('.flow-pos-dropdown-trigger-text') as HTMLElement
    expect(text).toBeTruthy()
    expect(text.textContent).toBe('Relative')
  })

  it('renders offset inputs', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const offsetInputs = shadowRoot.querySelectorAll('.flow-pos-offset-cell input[type="text"]')
    // 4 offset inputs: top, right, bottom, left
    expect(offsetInputs.length).toBe(4)
  })

  it('renders z-index input', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    tool.attach(target)

    const zInput = shadowRoot.querySelector('.flow-pos-zindex-input') as HTMLInputElement
    expect(zInput).toBeTruthy()
  })

  it('renders origin preset buttons for absolute position', () => {
    const tool = createPositionTool({ shadowRoot, engine, onUpdate })
    target.style.position = 'absolute'
    tool.attach(target)

    const originBtns = shadowRoot.querySelectorAll('.flow-pos-origin-btn')
    // 10 origin presets (3x3 grid + full)
    expect(originBtns.length).toBe(10)
  })

  // DOM reorder tests moved to moveTool — reorder now lives in Move mode (M key)
})
