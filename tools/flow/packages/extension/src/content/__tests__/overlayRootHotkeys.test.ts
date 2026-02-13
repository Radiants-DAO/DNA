import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureOverlayRoot, removeOverlayRoot } from '../overlays/overlayRoot'

describe('overlayRoot keyboard suppression', () => {
  afterEach(() => {
    removeOverlayRoot()
  })

  it('stops keydown propagation from editable controls inside overlay root', () => {
    const shadow = ensureOverlayRoot()
    const input = document.createElement('input')
    shadow.appendChild(input)

    const docHandler = vi.fn()
    document.addEventListener('keydown', docHandler)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true, composed: true }))

    document.removeEventListener('keydown', docHandler)
    expect(docHandler).not.toHaveBeenCalled()
  })

  it('allows keydown propagation from non-editable elements', () => {
    const shadow = ensureOverlayRoot()
    const button = document.createElement('button')
    shadow.appendChild(button)

    const docHandler = vi.fn()
    document.addEventListener('keydown', docHandler)

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true, composed: true }))

    document.removeEventListener('keydown', docHandler)
    expect(docHandler).toHaveBeenCalledTimes(1)
  })
})
