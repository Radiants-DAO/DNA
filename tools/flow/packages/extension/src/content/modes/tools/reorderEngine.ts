/**
 * Reorder Engine — pure DOM reorder operations with undo/redo support.
 *
 * Extracted from positionTool. Provides 6 move operations (up, down, first,
 * last, promote, demote) that record reversible mutations via the unified
 * mutation engine.
 *
 * Used by both Move mode (keyboard + drag-and-drop) and potentially
 * a future Layers panel.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'

// ── Types ──

export interface DomSnapshot {
  element: HTMLElement
  parent: HTMLElement
  nextSibling: Node | null
}

export interface ReorderEngine {
  moveUp: () => boolean
  moveDown: () => boolean
  moveToFirst: () => boolean
  moveToLast: () => boolean
  promote: () => boolean
  demote: () => boolean
  /** Move element to a specific position: before `referenceNode` in `parent`. */
  moveTo: (parent: HTMLElement, referenceNode: Node | null) => boolean
  /** Get current position label ("child 3 of 5"). */
  getPositionLabel: () => string
  /** Set the target element. */
  setTarget: (el: HTMLElement | null) => void
  getTarget: () => HTMLElement | null
}

// ── Helpers (exported for drag-and-drop use) ──

function getElementLabel(el: HTMLElement): string {
  if (el.id) return `#${el.id}`
  if (el.className && typeof el.className === 'string') {
    const first = el.className.trim().split(/\s+/)[0]
    if (first) return first
  }
  return el.tagName.toLowerCase()
}

export function captureSnapshot(el: HTMLElement): DomSnapshot | null {
  if (!el.parentElement) return null
  return {
    element: el,
    parent: el.parentElement,
    nextSibling: el.nextSibling,
  }
}

export function restoreSnapshot(snapshot: DomSnapshot): void {
  const { element, parent, nextSibling } = snapshot
  if (nextSibling && nextSibling.parentNode === parent) {
    parent.insertBefore(element, nextSibling)
    return
  }
  parent.appendChild(element)
}

export function describeSnapshot(snapshot: DomSnapshot): string {
  const siblings = Array.from(snapshot.parent.children)
  const index = siblings.indexOf(snapshot.element)
  const parentLabel = getElementLabel(snapshot.parent)
  if (index === -1) return `detached from ${parentLabel}`
  return `child ${index + 1} of ${siblings.length} in ${parentLabel}`
}

// ── Factory ──

export function createReorderEngine(
  engine: UnifiedMutationEngine,
  onReorder?: () => void,
): ReorderEngine {
  let target: HTMLElement | null = null

  function commitReorder(move: () => void): boolean {
    if (!target) return false
    const el = target
    const before = captureSnapshot(el)
    if (!before) return false
    const beforeValue = describeSnapshot(before)

    move()

    const after = captureSnapshot(el)
    if (!after) return false

    if (before.parent === after.parent && before.nextSibling === after.nextSibling) {
      return false
    }

    const afterValue = describeSnapshot(after)
    engine.recordCustomMutation(
      el,
      'structure',
      [{ property: 'dom-order', oldValue: beforeValue, newValue: afterValue }],
      { revert: () => restoreSnapshot(before), reapply: () => restoreSnapshot(after) },
    )

    onReorder?.()
    return true
  }

  return {
    setTarget(el) { target = el },
    getTarget() { return target },

    getPositionLabel() {
      if (!target || !target.parentElement) return 'child \u2013 of \u2013'
      const siblings = Array.from(target.parentElement.children)
      const index = siblings.indexOf(target)
      return `child ${index + 1} of ${siblings.length}`
    },

    moveUp() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      const prev = el.previousElementSibling
      if (!parent || !prev) return false
      return commitReorder(() => parent.insertBefore(el, prev))
    },

    moveDown() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      const next = el.nextElementSibling
      if (!parent || !next) return false
      return commitReorder(() => parent.insertBefore(el, next.nextSibling))
    },

    moveToFirst() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      if (!parent || parent.firstElementChild === el) return false
      return commitReorder(() => parent.insertBefore(el, parent.firstChild))
    },

    moveToLast() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      if (!parent || parent.lastElementChild === el) return false
      return commitReorder(() => parent.appendChild(el))
    },

    promote() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      const grandParent = parent?.parentElement
      if (!parent || !grandParent) return false
      return commitReorder(() => grandParent.insertBefore(el, parent))
    },

    demote() {
      if (!target) return false
      const el = target
      const parent = el.parentElement
      const prev = el.previousElementSibling
      if (!parent || !prev) return false
      return commitReorder(() => prev.appendChild(el))
    },

    moveTo(parent: HTMLElement, referenceNode: Node | null) {
      if (!target) return false
      const el = target
      return commitReorder(() => {
        if (referenceNode) {
          parent.insertBefore(el, referenceNode)
        } else {
          parent.appendChild(el)
        }
      })
    },
  }
}
