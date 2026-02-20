/**
 * Move Tool — Top-Level Mode (M)
 *
 * On-canvas DOM reordering:
 * - Click to select an element for keyboard reorder
 * - Arrow keys: ↑↓ reorder siblings, ←→ promote/demote, Shift = first/last
 * - Drag-and-drop with placeholder-driven live reflow
 * - Cmd/Ctrl during drag enables reparenting
 *
 * Uses the extracted reorderEngine for keyboard mutations.
 * Drag-and-drop uses captureSnapshot/restoreSnapshot directly
 * for the before/after undo pair.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import {
  createReorderEngine,
  captureSnapshot,
  restoreSnapshot,
  describeSnapshot,
  type ReorderEngine,
  type DomSnapshot,
} from './reorderEngine'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'
import styles from './moveTool.css?inline'

export interface MoveToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface MoveTool {
  /** Set the selected element for keyboard reorder. */
  select: (element: HTMLElement) => void
  /** Clear selection. */
  deselect: () => void
  /** Clean up all resources. */
  destroy: () => void
  /** Start drag from an external mousedown (called by content.ts). */
  beginDrag: (element: HTMLElement, clientX: number, clientY: number) => void
  /** Update drag position (called by content.ts on mousemove). */
  updateDrag: (clientX: number, clientY: number, cmdHeld: boolean) => void
  /** End drag (called by content.ts on mouseup). */
  endDrag: () => void
  /** Whether a drag is currently in progress. */
  isDragging: () => boolean
}

export function createMoveTool(options: MoveToolOptions): MoveTool {
  const { shadowRoot, engine, onUpdate } = options

  // ── Inject styles ──
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Reorder engine (for keyboard moves) ──
  const reorder: ReorderEngine = createReorderEngine(engine, () => {
    flashElement()
    updateLabel()
    onUpdate?.()
  })

  // ── Flash zone (visual feedback on reorder) ──
  const flashZone = document.createElement('div')
  flashZone.className = 'flow-move-flash'
  shadowRoot.appendChild(flashZone)

  // ── Floating label ("child 3 of 5") ──
  const label = document.createElement('div')
  label.className = 'flow-move-label'
  label.style.display = 'none'
  shadowRoot.appendChild(label)

  let flashTimer: ReturnType<typeof setTimeout> | null = null

  function flashElement() {
    const target = reorder.getTarget()
    if (!target) return
    const rect = target.getBoundingClientRect()
    flashZone.style.left = `${rect.left}px`
    flashZone.style.top = `${rect.top}px`
    flashZone.style.width = `${rect.width}px`
    flashZone.style.height = `${rect.height}px`
    flashZone.style.display = 'block'
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashZone.style.display = 'none' }, 300)
  }

  function updateLabel() {
    const target = reorder.getTarget()
    if (!target) {
      label.style.display = 'none'
      return
    }
    label.textContent = reorder.getPositionLabel()
    const rect = target.getBoundingClientRect()
    label.style.left = `${rect.left}px`
    label.style.top = `${rect.top - 24}px`
    label.style.display = ''
  }

  // ── Keyboard handler ──
  function onKeyDown(e: KeyboardEvent) {
    if (!reorder.getTarget()) return
    if (shouldIgnoreKeyboardShortcut(e)) return

    // Escape during drag → cancel
    if (e.key === 'Escape' && isDragActive) {
      e.preventDefault()
      e.stopPropagation()
      cancelDrag()
      return
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) reorder.moveToFirst()
        else reorder.moveUp()
        break
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) reorder.moveToLast()
        else reorder.moveDown()
        break
      case 'ArrowLeft':
        e.preventDefault()
        e.stopPropagation()
        reorder.promote()
        break
      case 'ArrowRight':
        e.preventDefault()
        e.stopPropagation()
        reorder.demote()
        break
    }
  }

  // ══════════════════════════════════════════════════════════
  // DRAG-AND-DROP
  // ══════════════════════════════════════════════════════════

  const DRAG_THRESHOLD = 3
  let isDragActive = false
  let dragTarget: HTMLElement | null = null
  let dragStartX = 0
  let dragStartY = 0
  let dragStartRect: DOMRect | null = null
  let beforeSnapshot: DomSnapshot | null = null
  let placeholder: HTMLElement | null = null
  let cursorLabel: HTMLElement | null = null
  let dragInitiated = false // true once threshold is crossed

  // Sibling midpoint cache (rebuilt on drag start and reparent)
  interface SiblingSlot {
    element: Element
    midpoint: number
  }
  let siblingSlots: SiblingSlot[] = []
  let flowAxis: 'horizontal' | 'vertical' = 'vertical'

  function startDrag(el: HTMLElement, clientX: number, clientY: number) {
    isDragActive = true
    dragTarget = el

    // Capture undo snapshot
    beforeSnapshot = captureSnapshot(el)

    // Cache sibling positions for hit-testing
    rebuildSiblingSlots(el)

    // Record element's current rect
    dragStartRect = el.getBoundingClientRect()
    const { width, height } = dragStartRect

    // Create placeholder at element's current position
    placeholder = document.createElement('div')
    placeholder.className = 'flow-move-placeholder'
    placeholder.style.width = `${width}px`
    placeholder.style.height = `${height}px`
    el.parentElement!.insertBefore(placeholder, el)

    // Lift element: position fixed, elevated visual
    el.style.position = 'fixed'
    el.style.zIndex = '2147483647'
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    el.style.left = `${dragStartRect.left}px`
    el.style.top = `${dragStartRect.top}px`
    el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
    el.style.transform = 'scale(1.02)'
    el.style.transition = 'box-shadow 0.15s ease-out, transform 0.15s ease-out'
    el.style.pointerEvents = 'none'

    // Add reflow transitions to siblings
    const parent = placeholder.parentElement
    if (parent) {
      for (const child of Array.from(parent.children)) {
        if (child === placeholder || child === el) continue
        ;(child as HTMLElement).style.transition = 'transform 0.15s ease-out'
      }
    }

    // Cursor label
    cursorLabel = document.createElement('div')
    cursorLabel.className = 'flow-move-cursor-label'
    shadowRoot.appendChild(cursorLabel)
    updateCursorLabel(clientX, clientY)

    // Suppress text selection
    document.body.style.userSelect = 'none'
  }

  function onDragMove(clientX: number, clientY: number, cmdHeld: boolean) {
    if (!isDragActive || !dragTarget || !placeholder) return

    // Move element to cursor
    dragTarget.style.left = `${clientX - (dragStartRect!.width / 2)}px`
    dragTarget.style.top = `${clientY - (dragStartRect!.height / 2)}px`

    // Cmd/Ctrl held: reparent mode
    if (cmdHeld) {
      const parent = placeholder.parentElement
      if (!parent) return

      // Check if cursor is over a sibling's interior (demote into it)
      for (const slot of siblingSlots) {
        const sibRect = slot.element.getBoundingClientRect()
        const inset = 8
        if (
          clientX > sibRect.left + inset &&
          clientX < sibRect.right - inset &&
          clientY > sibRect.top + inset &&
          clientY < sibRect.bottom - inset
        ) {
          const newParent = slot.element as HTMLElement
          newParent.appendChild(placeholder)
          rebuildSiblingSlots(dragTarget)
          updateCursorLabel(clientX, clientY)
          return
        }
      }

      // Check if cursor is outside parent bounds (promote)
      const parentRect = parent.getBoundingClientRect()
      if (
        clientY < parentRect.top - 20 ||
        clientY > parentRect.bottom + 20 ||
        clientX < parentRect.left - 20 ||
        clientX > parentRect.right + 20
      ) {
        const grandParent = parent.parentElement
        if (grandParent) {
          grandParent.insertBefore(placeholder, parent)
          rebuildSiblingSlots(dragTarget)
          updateCursorLabel(clientX, clientY)
          return
        }
      }
    }

    // Find nearest sibling slot
    const pos = flowAxis === 'vertical' ? clientY : clientX
    let insertBefore: Element | null = null

    for (const slot of siblingSlots) {
      if (pos < slot.midpoint) {
        insertBefore = slot.element
        break
      }
    }

    // Move placeholder to the target position
    const parent = placeholder.parentElement
    if (parent) {
      if (insertBefore && insertBefore !== placeholder) {
        parent.insertBefore(placeholder, insertBefore)
      } else if (!insertBefore) {
        parent.appendChild(placeholder)
      }
    }

    updateCursorLabel(clientX, clientY)
  }

  function finishDrag() {
    if (!isDragActive || !dragTarget || !placeholder || !beforeSnapshot) return

    const el = dragTarget
    const parent = placeholder.parentElement!
    const refNode = placeholder.nextSibling

    // Remove placeholder
    placeholder.remove()
    placeholder = null

    // Remove elevated styles
    clearDragStyles(el)

    // Remove sibling transitions
    for (const child of Array.from(parent.children)) {
      ;(child as HTMLElement).style.transition = ''
    }

    // Insert element at placeholder's final position
    if (refNode) {
      parent.insertBefore(el, refNode)
    } else {
      parent.appendChild(el)
    }

    // Record undo mutation
    const afterSnapshot = captureSnapshot(el)
    if (afterSnapshot &&
        (beforeSnapshot.parent !== afterSnapshot.parent ||
         beforeSnapshot.nextSibling !== afterSnapshot.nextSibling)) {
      engine.recordCustomMutation(
        el,
        'structure',
        [{ property: 'dom-order', oldValue: describeSnapshot(beforeSnapshot), newValue: describeSnapshot(afterSnapshot) }],
        { revert: () => restoreSnapshot(beforeSnapshot!), reapply: () => restoreSnapshot(afterSnapshot!) },
      )
    }

    cleanupDragState()
    // Update keyboard reorder target to the dropped element
    reorder.setTarget(el)
    flashElement()
    updateLabel()
    onUpdate?.()
  }

  function cancelDrag() {
    if (!isDragActive || !dragTarget || !beforeSnapshot) return

    const el = dragTarget

    // Remove placeholder
    placeholder?.remove()
    placeholder = null

    // Remove elevated styles
    clearDragStyles(el)

    // Remove sibling transitions
    if (el.parentElement) {
      for (const child of Array.from(el.parentElement.children)) {
        ;(child as HTMLElement).style.transition = ''
      }
    }

    // Restore original position
    restoreSnapshot(beforeSnapshot)

    cleanupDragState()
  }

  function clearDragStyles(el: HTMLElement) {
    el.style.position = ''
    el.style.zIndex = ''
    el.style.width = ''
    el.style.height = ''
    el.style.left = ''
    el.style.top = ''
    el.style.boxShadow = ''
    el.style.transform = ''
    el.style.transition = ''
    el.style.pointerEvents = ''
  }

  function cleanupDragState() {
    cursorLabel?.remove()
    cursorLabel = null
    document.body.style.userSelect = ''
    isDragActive = false
    dragTarget = null
    dragStartRect = null
    beforeSnapshot = null
    dragInitiated = false
    siblingSlots = []
  }

  function rebuildSiblingSlots(el: HTMLElement) {
    siblingSlots = []
    const parent = placeholder?.parentElement || el.parentElement
    if (!parent) return

    // Detect flow axis from parent's layout
    const parentStyle = getComputedStyle(parent)
    const display = parentStyle.display
    const direction = parentStyle.flexDirection
    if (display.includes('flex') && (direction === 'row' || direction === 'row-reverse')) {
      flowAxis = 'horizontal'
    } else {
      flowAxis = 'vertical'
    }

    for (const child of Array.from(parent.children)) {
      if (child === el || child === placeholder) continue
      const rect = child.getBoundingClientRect()
      const midpoint = flowAxis === 'vertical'
        ? rect.top + rect.height / 2
        : rect.left + rect.width / 2
      siblingSlots.push({ element: child, midpoint })
    }
  }

  function updateCursorLabel(clientX: number, clientY: number) {
    if (!cursorLabel || !placeholder) return
    const parent = placeholder.parentElement
    if (!parent) return
    const siblings = Array.from(parent.children).filter(c => c !== dragTarget)
    const idx = siblings.indexOf(placeholder)
    cursorLabel.textContent = `child ${idx + 1} of ${siblings.length}`
    cursorLabel.style.left = `${clientX}px`
    cursorLabel.style.top = `${clientY}px`
  }

  // ── Public API ──

  return {
    select(element: HTMLElement) {
      reorder.setTarget(element)
      updateLabel()
      document.addEventListener('keydown', onKeyDown)
    },

    deselect() {
      if (isDragActive) cancelDrag()
      reorder.setTarget(null)
      label.style.display = 'none'
      flashZone.style.display = 'none'
      document.removeEventListener('keydown', onKeyDown)
    },

    destroy() {
      if (isDragActive) cancelDrag()
      reorder.setTarget(null)
      document.removeEventListener('keydown', onKeyDown)
      flashZone.remove()
      label.remove()
      styleEl.remove()
    },

    // ── Drag API (called from content.ts mouse handlers) ──

    beginDrag(element: HTMLElement, clientX: number, clientY: number) {
      dragTarget = element
      dragStartX = clientX
      dragStartY = clientY
      dragInitiated = false
      // Select for keyboard fallback
      reorder.setTarget(element)
      document.addEventListener('keydown', onKeyDown)
    },

    updateDrag(clientX: number, clientY: number, cmdHeld: boolean) {
      if (!dragTarget) return

      // Check threshold before initiating
      if (!dragInitiated) {
        const dx = clientX - dragStartX
        const dy = clientY - dragStartY
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
        dragInitiated = true
        startDrag(dragTarget, clientX, clientY)
        return
      }

      onDragMove(clientX, clientY, cmdHeld)
    },

    endDrag() {
      if (!dragTarget) return

      if (!dragInitiated) {
        // Threshold was never crossed — treat as a click (select for keyboard)
        updateLabel()
        dragTarget = null
        return
      }

      finishDrag()
    },

    isDragging() {
      return isDragActive
    },
  }
}
