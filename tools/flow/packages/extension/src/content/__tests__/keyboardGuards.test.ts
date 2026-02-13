import { describe, expect, it } from 'vitest'
import {
  isEditableElement,
  shouldIgnoreKeyboardShortcut,
} from '../features/keyboardGuards'

describe('keyboardGuards', () => {
  it('detects editable element types', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const contentEditable = document.createElement('div')
    const plain = document.createElement('div')
    contentEditable.setAttribute('contenteditable', 'true')

    expect(isEditableElement(input)).toBe(true)
    expect(isEditableElement(textarea)).toBe(true)
    expect(isEditableElement(select)).toBe(true)
    expect(isEditableElement(contentEditable)).toBe(true)
    expect(isEditableElement(plain)).toBe(false)
  })

  it('ignores shortcuts when keydown comes from editable target', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    let ignored = false
    const handler = (event: KeyboardEvent) => {
      ignored = shouldIgnoreKeyboardShortcut(event)
    }

    document.addEventListener('keydown', handler, true)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))
    document.removeEventListener('keydown', handler, true)

    expect(ignored).toBe(true)
    input.remove()
  })

  it('ignores shortcuts when active element is editable', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    let ignored = false
    const handler = (event: KeyboardEvent) => {
      ignored = shouldIgnoreKeyboardShortcut(event)
    }

    document.addEventListener('keydown', handler, true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))
    document.removeEventListener('keydown', handler, true)

    expect(ignored).toBe(true)
    input.remove()
  })
})
