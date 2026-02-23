import { vi } from 'vitest'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

/**
 * Create a ShadowRoot attached to a host element in the document body.
 * Uses 'open' mode so tests can query internal DOM.
 */
export function createTestShadowRoot(): ShadowRoot {
  const host = document.createElement('div')
  document.body.appendChild(host)
  return host.attachShadow({ mode: 'open' })
}

/**
 * Create a target element with common defaults.
 * Appends to document.body so getComputedStyle works.
 */
export function createTargetElement(
  tag: string = 'div',
  styles: Partial<CSSStyleDeclaration> = {},
): HTMLElement {
  const el = document.createElement(tag)
  Object.assign(el.style, styles)
  document.body.appendChild(el)
  return el
}

/**
 * Dispatch a KeyboardEvent on the document.
 */
export function dispatchKey(
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>> = {},
  target: EventTarget = document,
) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    }),
  )
}

/**
 * Standard tool test setup: engine + shadowRoot + target + onUpdate spy.
 */
export function createToolTestContext(
  targetStyles: Partial<CSSStyleDeclaration> = {},
  targetTag: string = 'div',
) {
  const engine = createUnifiedMutationEngine()
  const shadowRoot = createTestShadowRoot()
  const target = createTargetElement(targetTag, targetStyles)
  const onUpdate = vi.fn()
  return { engine, shadowRoot, target, onUpdate }
}
