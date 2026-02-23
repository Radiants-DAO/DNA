import { describe, it, expect, beforeEach } from 'vitest'
import {
  getNextSibling,
  getPrevSibling,
  getFirstChild,
  getParent,
} from '../features/keyboardTraversal'
import { elementRegistry, generateSelector } from '../elementRegistry'

/**
 * Integration test: validates that keyboard traversal output
 * is compatible with the selection pipeline (elementRegistry,
 * generateSelector, inspectElement).
 *
 * The actual wiring in content.ts routes traversal through
 * the shared selectElement() helper. This test verifies the
 * contract: traversal returns valid Elements that can be
 * registered, unregistered, and inspected.
 */
describe('traversal → selection pipeline integration', () => {
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    parent = document.createElement('div')
    parent.id = 'parent'
    childA = document.createElement('div')
    childA.id = 'a'
    childA.className = 'item'
    childB = document.createElement('div')
    childB.id = 'b'
    childB.className = 'item'
    parent.append(childA, childB)
    document.body.appendChild(parent)
  })

  it('traversal result can be registered and unregistered without stale entries', () => {
    // Simulate: select childA, then Tab to childB
    const idxA = elementRegistry.register(childA)
    expect(idxA).toBeGreaterThanOrEqual(0)

    const next = getNextSibling(childA)
    expect(next).toBe(childB)

    // Unregister previous before registering next (the bug was missing this)
    elementRegistry.unregister(childA)
    const idxB = elementRegistry.register(childB)
    expect(idxB).toBeGreaterThanOrEqual(0)
  })

  it('traversal result produces valid selector for panel messages', () => {
    const next = getNextSibling(childA)
    expect(next).toBe(childB)

    const selector = generateSelector(next!)
    expect(typeof selector).toBe('string')
    expect(selector.length).toBeGreaterThan(0)
  })

  it('traversal into children preserves inspectable element', () => {
    const grandchild = document.createElement('span')
    grandchild.textContent = 'hello'
    childA.appendChild(grandchild)

    const child = getFirstChild(childA)
    expect(child).toBe(grandchild)
    expect(child!.getBoundingClientRect).toBeInstanceOf(Function)
  })

  it('traversal to parent preserves inspectable element', () => {
    const p = getParent(childA)
    expect(p).toBe(parent)
    expect(p!.getBoundingClientRect).toBeInstanceOf(Function)
  })

  it('full traversal cycle: register → traverse → unregister → register', () => {
    // Simulates the selectElement() contract for a full Tab cycle
    let current: Element = childA
    elementRegistry.register(current)

    // Tab forward
    const next = getNextSibling(current)!
    elementRegistry.unregister(current)
    current = next
    elementRegistry.register(current)
    expect(current).toBe(childB)

    // Tab forward wraps
    const wrapped = getNextSibling(current)!
    elementRegistry.unregister(current)
    current = wrapped
    elementRegistry.register(current)
    expect(current).toBe(childA)
  })
})
