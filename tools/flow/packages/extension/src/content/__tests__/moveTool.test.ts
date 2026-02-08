import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMoveTool } from '../modes/tools/moveTool'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('MoveTool', () => {
  let engine: UnifiedMutationEngine
  let shadowRoot: ShadowRoot
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement
  let onUpdate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
    onUpdate = vi.fn()

    // Create a closed shadow root for the tool to render into
    const host = document.createElement('div')
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: 'open' })

    // Create a parent with three children: A, B, C
    parent = document.createElement('div')
    childA = document.createElement('div')
    childA.textContent = 'A'
    childB = document.createElement('div')
    childB.textContent = 'B'
    childC = document.createElement('div')
    childC.textContent = 'C'
    parent.appendChild(childA)
    parent.appendChild(childB)
    parent.appendChild(childC)
    document.body.appendChild(parent)
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

  it('creates without errors', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    expect(tool).toBeDefined()
    expect(tool.attach).toBeInstanceOf(Function)
    expect(tool.detach).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
    expect(tool.undo).toBeInstanceOf(Function)
  })

  it('attaches and shows overlay', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).not.toBe('none')
  })

  it('detaches and hides overlay', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)
    tool.detach()

    const container = shadowRoot.querySelector('div')!
    expect(container.style.display).toBe('none')
  })

  it('destroys and removes container', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)
    tool.destroy()

    expect(shadowRoot.children.length).toBe(0)
  })

  it('up arrow moves element before previous sibling', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    dispatchKey('ArrowUp')

    // Order should now be B, A, C
    expect(Array.from(parent.children)).toEqual([childB, childA, childC])
    expect(onUpdate).toHaveBeenCalled()
  })

  it('down arrow moves element after next sibling', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    dispatchKey('ArrowDown')

    // Order should now be A, C, B
    expect(Array.from(parent.children)).toEqual([childA, childC, childB])
    expect(onUpdate).toHaveBeenCalled()
  })

  it('does nothing when element has no sibling in that direction', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childA)

    // childA is already first — up should do nothing
    dispatchKey('ArrowUp')
    expect(Array.from(parent.children)).toEqual([childA, childB, childC])
    expect(onUpdate).not.toHaveBeenCalled()

    // childC is already last — down should do nothing
    tool.detach()
    onUpdate.mockClear()
    tool.attach(childC)
    dispatchKey('ArrowDown')
    expect(Array.from(parent.children)).toEqual([childA, childB, childC])
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('left arrow promotes element (moves before parent)', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    dispatchKey('ArrowLeft')

    // childB should now be a sibling of parent, before parent
    const grandParent = parent.parentElement!
    const siblings = Array.from(grandParent.children)
    expect(siblings.indexOf(childB)).toBeLessThan(siblings.indexOf(parent))
    expect(Array.from(parent.children)).toEqual([childA, childC])
    expect(onUpdate).toHaveBeenCalled()
  })

  it('right arrow demotes element (moves into previous sibling)', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    dispatchKey('ArrowRight')

    // childB should now be last child of childA
    expect(Array.from(parent.children)).toEqual([childA, childC])
    expect(childA.lastElementChild).toBe(childB)
    expect(onUpdate).toHaveBeenCalled()
  })

  it('shift+up moves to first child position', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childC)

    dispatchKey('ArrowUp', { shiftKey: true })

    // childC should now be first
    expect(Array.from(parent.children)).toEqual([childC, childA, childB])
    expect(onUpdate).toHaveBeenCalled()
  })

  it('shift+down moves to last child position', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childA)

    dispatchKey('ArrowDown', { shiftKey: true })

    // childA should now be last
    expect(Array.from(parent.children)).toEqual([childB, childC, childA])
    expect(onUpdate).toHaveBeenCalled()
  })

  it('does nothing when no target attached', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })

    dispatchKey('ArrowUp')
    dispatchKey('ArrowDown')
    dispatchKey('ArrowLeft')
    dispatchKey('ArrowRight')

    expect(Array.from(parent.children)).toEqual([childA, childB, childC])
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('supports internal undo', () => {
    const tool = createMoveTool({ shadowRoot, engine, onUpdate })
    tool.attach(childB)

    // Move B up (B, A, C)
    dispatchKey('ArrowUp')
    expect(Array.from(parent.children)).toEqual([childB, childA, childC])

    // Undo — should restore to A, B, C
    const undone = tool.undo()
    expect(undone).toBe(true)
    expect(Array.from(parent.children)).toEqual([childA, childB, childC])

    // Undo again — nothing to undo
    const undone2 = tool.undo()
    expect(undone2).toBe(false)
  })
})
