import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMoveTool, type MoveTool } from '../modes/tools/moveTool'
import { createToolTestContext, dispatchKey } from './toolTestHelpers'

// Mock CSS import
vi.mock('../modes/tools/moveTool.css?inline', () => ({ default: '' }))

vi.mock('../features/keyboardGuards', () => ({
  shouldIgnoreKeyboardShortcut: () => false,
}))

describe('MoveTool', () => {
  let ctx: ReturnType<typeof createToolTestContext>
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement
  let tool: MoveTool

  beforeEach(() => {
    ctx = createToolTestContext()

    parent = document.createElement('div')
    childA = document.createElement('div')
    childA.id = 'a'
    childA.textContent = 'A'
    childB = document.createElement('div')
    childB.id = 'b'
    childB.textContent = 'B'
    childC = document.createElement('div')
    childC.id = 'c'
    childC.textContent = 'C'
    parent.append(childA, childB, childC)
    document.body.appendChild(parent)

    tool = createMoveTool({
      shadowRoot: ctx.shadowRoot,
      engine: ctx.engine,
      onUpdate: ctx.onUpdate,
    })
  })

  it('creates with select/deselect/destroy/beginDrag/isDragging', () => {
    expect(tool.select).toBeInstanceOf(Function)
    expect(tool.deselect).toBeInstanceOf(Function)
    expect(tool.destroy).toBeInstanceOf(Function)
    expect(tool.beginDrag).toBeInstanceOf(Function)
    expect(tool.isDragging).toBeInstanceOf(Function)
  })

  it('isDragging returns false initially', () => {
    expect(tool.isDragging()).toBe(false)
  })

  it('select shows position label', () => {
    tool.select(childB)
    const label = ctx.shadowRoot.querySelector('.flow-move-label') as HTMLElement
    expect(label).not.toBeNull()
    // Label should contain position info
    expect(label.style.display).not.toBe('none')
  })

  it('deselect hides label', () => {
    tool.select(childB)
    tool.deselect()
    const label = ctx.shadowRoot.querySelector('.flow-move-label') as HTMLElement
    expect(label.style.display).toBe('none')
  })

  it('ArrowDown reorders selected element', () => {
    tool.select(childA)

    dispatchKey('ArrowDown')

    expect(Array.from(parent.children).map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(ctx.onUpdate).toHaveBeenCalled()
  })

  it('ArrowUp reorders selected element', () => {
    tool.select(childC)

    dispatchKey('ArrowUp')

    expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'c', 'b'])
  })

  it('Shift+ArrowUp moves to first', () => {
    tool.select(childC)

    dispatchKey('ArrowUp', { shiftKey: true })

    expect(parent.firstElementChild).toBe(childC)
  })

  it('Shift+ArrowDown moves to last', () => {
    tool.select(childA)

    dispatchKey('ArrowDown', { shiftKey: true })

    expect(parent.lastElementChild).toBe(childA)
  })

  it('destroy cleans up DOM elements', () => {
    tool.select(childB)
    tool.destroy()

    expect(ctx.shadowRoot.querySelector('.flow-move-flash')).toBeNull()
    expect(ctx.shadowRoot.querySelector('.flow-move-label')).toBeNull()
  })
})
