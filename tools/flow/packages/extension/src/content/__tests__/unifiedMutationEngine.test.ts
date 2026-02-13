import { describe, it, expect, beforeEach } from 'vitest'
import { createUnifiedMutationEngine, type UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

describe('UnifiedMutationEngine', () => {
  let engine: UnifiedMutationEngine

  beforeEach(() => {
    engine = createUnifiedMutationEngine()
  })

  describe('applyStyle', () => {
    it('should apply a style mutation and track before/after', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      const diff = engine.applyStyle(el, { color: 'blue' })
      expect(diff).not.toBeNull()
      // Computed values are rgb() format
      expect(diff!.changes[0].oldValue).toContain('255')
      expect(diff!.changes[0].newValue).toContain('0, 0, 255')
      expect(el.style.color).toBe('blue')

      el.remove()
    })

    it('should return null when no change occurs', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      const diff = engine.applyStyle(el, { color: 'red' })
      expect(diff).toBeNull()

      el.remove()
    })

    it('should handle multiple properties in one call', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      const diff = engine.applyStyle(el, { color: 'blue', fontSize: '16px' })
      expect(diff).not.toBeNull()
      expect(diff!.changes.length).toBeGreaterThanOrEqual(1)

      el.remove()
    })
  })

  describe('undo/redo', () => {
    it('should revert a mutation on undo', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      expect(el.style.color).toBe('blue')

      engine.undo()
      expect(el.style.color).toBe('red')

      el.remove()
    })

    it('should re-apply a mutation on redo', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.undo()
      expect(el.style.color).toBe('red')

      engine.redo()
      // Redo re-applies computed value via setProperty
      expect(el.style.color).toContain('0, 0, 255')

      el.remove()
    })

    it('should clear redo stack on new mutation', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.undo()
      expect(engine.canRedo).toBe(true)

      engine.applyStyle(el, { color: 'green' })
      expect(engine.canRedo).toBe(false)

      el.remove()
    })

    it('should report canUndo and canRedo correctly', () => {
      expect(engine.canUndo).toBe(false)
      expect(engine.canRedo).toBe(false)

      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      expect(engine.canUndo).toBe(true)
      expect(engine.canRedo).toBe(false)

      engine.undo()
      expect(engine.canUndo).toBe(false)
      expect(engine.canRedo).toBe(true)

      el.remove()
    })
  })

  describe('batch coalescing', () => {
    it('should coalesce batched changes into a single undo step', () => {
      const el = document.createElement('div')
      el.style.fontSize = '12px'
      document.body.appendChild(el)

      engine.beginBatch()
      engine.applyStyle(el, { fontSize: '13px' })
      engine.applyStyle(el, { fontSize: '14px' })
      engine.applyStyle(el, { fontSize: '15px' })
      engine.commitBatch()

      expect(el.style.fontSize).toBe('15px')

      // Single undo should revert all three
      engine.undo()
      expect(el.style.fontSize).toBe('12px')

      el.remove()
    })

    it('should discard empty batches', () => {
      engine.beginBatch()
      engine.commitBatch()
      expect(engine.canUndo).toBe(false)
    })
  })

  describe('cancelBatch', () => {
    it('should discard batch entries without pushing to undo stack', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.beginBatch()
      engine.applyStyle(el, { color: 'blue' })
      engine.cancelBatch()

      // DOM change was applied but batch was not committed
      expect(el.style.color).toBe('blue')
      expect(engine.canUndo).toBe(false)
      expect(engine.getDiffs()).toHaveLength(0)

      el.remove()
    })

    it('should not affect redo stack', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.undo()
      expect(engine.canRedo).toBe(true)

      // Cancel an unrelated batch — redo should survive
      engine.beginBatch()
      engine.cancelBatch()
      expect(engine.canRedo).toBe(true)

      el.remove()
    })
  })

  describe('getDiffs', () => {
    it('should return all accumulated diffs', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })

      const diffs = engine.getDiffs()
      expect(diffs).toHaveLength(1)
      expect(diffs[0].type).toBe('style')
      expect(diffs[0].changes[0].property).toBe('color')

      el.remove()
    })

    it('should not include undone diffs', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.undo()

      expect(engine.getDiffs()).toHaveLength(0)

      el.remove()
    })
  })

  describe('getNetDiffs', () => {
    it('should squash multiple changes to same property into one', () => {
      const el = document.createElement('div')
      el.style.marginLeft = '0px'
      document.body.appendChild(el)

      engine.applyStyle(el, { marginLeft: '4px' })
      engine.applyStyle(el, { marginLeft: '8px' })
      engine.applyStyle(el, { marginLeft: '12px' })

      const raw = engine.getDiffs()
      expect(raw).toHaveLength(3)

      const net = engine.getNetDiffs()
      expect(net).toHaveLength(1)
      expect(net[0].changes).toHaveLength(1)
      expect(net[0].changes[0].property).toBe('margin-left')
      // First oldValue (0px computed) → last newValue (12px)
      expect(net[0].changes[0].newValue).toContain('12')

      el.remove()
    })

    it('should omit properties where net change is zero', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.applyStyle(el, { color: 'red' })

      const raw = engine.getDiffs()
      expect(raw).toHaveLength(2)

      const net = engine.getNetDiffs()
      expect(net).toHaveLength(0)

      el.remove()
    })

    it('should keep different properties on same element', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.applyStyle(el, { fontSize: '20px' })

      const net = engine.getNetDiffs()
      expect(net).toHaveLength(1) // One element
      expect(net[0].changes.length).toBe(2) // Two properties

      el.remove()
    })

    it('should handle multiple elements independently', () => {
      const el1 = document.createElement('div')
      const el2 = document.createElement('span')
      document.body.appendChild(el1)
      document.body.appendChild(el2)

      engine.applyStyle(el1, { color: 'blue' })
      engine.applyStyle(el2, { color: 'red' })

      const net = engine.getNetDiffs()
      expect(net).toHaveLength(2)

      el1.remove()
      el2.remove()
    })
  })

  describe('clearAll', () => {
    it('should undo everything and restore original state', () => {
      const el = document.createElement('div')
      el.style.color = 'red'
      el.style.fontSize = '12px'
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      engine.applyStyle(el, { fontSize: '20px' })

      engine.clearAll()
      expect(el.style.color).toBe('red')
      expect(el.style.fontSize).toBe('12px')
      expect(engine.getDiffs()).toHaveLength(0)
      expect(engine.canUndo).toBe(false)
      expect(engine.canRedo).toBe(false)

      el.remove()
    })
  })

  describe('text mutations', () => {
    it('should apply and track text changes', () => {
      const el = document.createElement('p')
      el.textContent = 'hello'
      document.body.appendChild(el)

      const diff = engine.applyText(el, 'world')
      expect(diff).not.toBeNull()
      expect(el.textContent).toBe('world')
      expect(diff!.type).toBe('text')

      el.remove()
    })

    it('should undo text changes', () => {
      const el = document.createElement('p')
      el.textContent = 'hello'
      document.body.appendChild(el)

      engine.applyText(el, 'world')
      engine.undo()
      expect(el.textContent).toBe('hello')

      el.remove()
    })

    it('should return null for no-op text change', () => {
      const el = document.createElement('p')
      el.textContent = 'hello'
      document.body.appendChild(el)

      const diff = engine.applyText(el, 'hello')
      expect(diff).toBeNull()

      el.remove()
    })
  })

  describe('custom mutations', () => {
    it('should record structural mutations and support undo/redo', () => {
      const parent = document.createElement('div')
      const a = document.createElement('div')
      const b = document.createElement('div')
      a.id = 'a'
      b.id = 'b'
      parent.appendChild(a)
      parent.appendChild(b)
      document.body.appendChild(parent)

      const reapply = () => parent.insertBefore(b, a)
      const revert = () => parent.insertBefore(b, a.nextSibling)

      // Mutation is applied externally, then recorded with revert/reapply handlers.
      reapply()
      const diff = engine.recordCustomMutation(
        b,
        'structure',
        [
          {
            property: 'dom-order',
            oldValue: 'child 2 of 2 in div',
            newValue: 'child 1 of 2 in div',
          },
        ],
        { revert, reapply },
      )

      expect(diff).not.toBeNull()
      expect(diff!.type).toBe('structure')
      expect(parent.firstElementChild).toBe(b)

      engine.undo()
      expect(Array.from(parent.children)).toEqual([a, b])

      engine.redo()
      expect(Array.from(parent.children)).toEqual([b, a])

      parent.remove()
    })
  })

  describe('subscribe', () => {
    it('should notify on mutations', () => {
      let callCount = 0
      engine.subscribe(() => { callCount++ })

      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      expect(callCount).toBe(1)

      engine.undo()
      expect(callCount).toBe(2)

      engine.redo()
      expect(callCount).toBe(3)

      el.remove()
    })

    it('should return unsubscribe function', () => {
      let callCount = 0
      const unsub = engine.subscribe(() => { callCount++ })

      const el = document.createElement('div')
      document.body.appendChild(el)

      engine.applyStyle(el, { color: 'blue' })
      expect(callCount).toBe(1)

      unsub()
      engine.applyStyle(el, { fontSize: '20px' })
      expect(callCount).toBe(1) // No additional call

      el.remove()
    })
  })
})
