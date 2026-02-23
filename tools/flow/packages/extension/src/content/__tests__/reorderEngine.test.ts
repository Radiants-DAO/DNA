import { describe, it, expect, beforeEach } from 'vitest'
import {
  createReorderEngine,
  captureSnapshot,
  restoreSnapshot,
  describeSnapshot,
  type ReorderEngine,
} from '../modes/tools/reorderEngine'
import { createUnifiedMutationEngine } from '../mutations/unifiedMutationEngine'
import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('reorderEngine', () => {
  let engine: UnifiedMutationEngine
  let reorder: ReorderEngine
  let parent: HTMLElement
  let childA: HTMLElement
  let childB: HTMLElement
  let childC: HTMLElement

  beforeEach(() => {
    engine = createUnifiedMutationEngine()

    parent = document.createElement('div')
    parent.id = 'container'
    document.body.appendChild(parent)

    childA = document.createElement('div')
    childA.id = 'a'
    childB = document.createElement('div')
    childB.id = 'b'
    childC = document.createElement('div')
    childC.id = 'c'
    parent.append(childA, childB, childC)

    reorder = createReorderEngine(engine)
  })

  describe('captureSnapshot / restoreSnapshot', () => {
    it('captures current position', () => {
      const snap = captureSnapshot(childB)
      expect(snap).not.toBeNull()
      expect(snap!.parent).toBe(parent)
      expect(snap!.nextSibling).toBe(childC)
    })

    it('restores to original position', () => {
      const snap = captureSnapshot(childB)!
      parent.appendChild(childB) // move to end
      expect(parent.lastElementChild).toBe(childB)
      restoreSnapshot(snap)
      expect(Array.from(parent.children).indexOf(childB)).toBe(1)
    })

    it('returns null for orphaned element', () => {
      const orphan = document.createElement('div')
      expect(captureSnapshot(orphan)).toBeNull()
    })
  })

  describe('describeSnapshot', () => {
    it('reports position correctly', () => {
      const snap = captureSnapshot(childB)!
      expect(describeSnapshot(snap)).toBe('child 2 of 3 in #container')
    })
  })

  describe('moveUp / moveDown', () => {
    it('moveDown swaps with next sibling', () => {
      reorder.setTarget(childA)
      expect(reorder.moveDown()).toBe(true)
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['b', 'a', 'c'])
    })

    it('moveUp swaps with previous sibling', () => {
      reorder.setTarget(childC)
      expect(reorder.moveUp()).toBe(true)
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'c', 'b'])
    })

    it('moveUp at first position returns false', () => {
      reorder.setTarget(childA)
      expect(reorder.moveUp()).toBe(false)
    })

    it('moveDown at last position returns false', () => {
      reorder.setTarget(childC)
      expect(reorder.moveDown()).toBe(false)
    })
  })

  describe('moveToFirst / moveToLast', () => {
    it('moveToFirst moves element to beginning', () => {
      reorder.setTarget(childC)
      expect(reorder.moveToFirst()).toBe(true)
      expect(parent.firstElementChild).toBe(childC)
    })

    it('moveToLast moves element to end', () => {
      reorder.setTarget(childA)
      expect(reorder.moveToLast()).toBe(true)
      expect(parent.lastElementChild).toBe(childA)
    })
  })

  describe('promote / demote', () => {
    it('demote moves element into previous sibling', () => {
      reorder.setTarget(childB)
      expect(reorder.demote()).toBe(true)
      expect(childA.contains(childB)).toBe(true)
    })

    it('promote moves element out of parent', () => {
      // Nest childB inside childA first
      childA.appendChild(childB)
      reorder.setTarget(childB)
      expect(reorder.promote()).toBe(true)
      expect(childB.parentElement).toBe(parent)
    })
  })

  describe('undo integration', () => {
    it('records custom mutation that can be undone', () => {
      reorder.setTarget(childA)
      reorder.moveDown()
      expect(engine.canUndo).toBe(true)
      engine.undo()
      expect(Array.from(parent.children).map(c => c.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('getPositionLabel', () => {
    it('returns human-readable position', () => {
      reorder.setTarget(childB)
      expect(reorder.getPositionLabel()).toBe('child 2 of 3')
    })

    it('returns dash for no target', () => {
      expect(reorder.getPositionLabel()).toBe('child \u2013 of \u2013')
    })
  })
})
