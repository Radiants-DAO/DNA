/**
 * Move / Reorder Tool — Design Sub-Mode 4
 *
 * VisBug-style DOM reorder tool. When active (Design → 4):
 * - Up arrow: move element before its previous sibling
 * - Down arrow: move element after its next sibling
 * - Left arrow: promote element (move before parent)
 * - Right arrow: demote element (move into previous sibling as last child)
 * - Shift+Up: move to first child position
 * - Shift+Down: move to last child position
 *
 * DOM reordering uses an internal undo stack (parent + nextSibling tuples)
 * since the unified mutation engine currently only handles style/text mutations.
 *
 * Reference: VisBug's move tool
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'

// ── Types ──

export interface MoveToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine  // For future integration
  onUpdate?: () => void
}

export interface MoveTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
  /** Undo the last DOM move. Returns true if something was undone. */
  undo: () => boolean
}

interface DomSnapshot {
  element: HTMLElement
  parent: HTMLElement
  nextSibling: Node | null
}

// ── Tool Implementation ──

export function createMoveTool(options: MoveToolOptions): MoveTool {
  const { shadowRoot, onUpdate } = options

  let target: HTMLElement | null = null
  const undoStack: DomSnapshot[] = []

  // Overlay container
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Grip handle indicator (6-dot grid)
  const gripHandle = document.createElement('div')
  gripHandle.style.cssText = `
    position: fixed;
    display: flex;
    flex-wrap: wrap;
    width: 14px;
    gap: 3px;
    padding: 3px;
    background: rgba(0, 0, 0, 0.75);
    border-radius: 3px;
    pointer-events: none;
    z-index: 1;
  `
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('div')
    dot.style.cssText = 'width: 3px; height: 3px; border-radius: 50%; background: #fff;'
    gripHandle.appendChild(dot)
  }
  container.appendChild(gripHandle)

  // Position label ("child N of M")
  const posLabel = document.createElement('div')
  posLabel.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font: 10px/1.3 ui-monospace, SFMono-Regular, monospace;
    padding: 2px 6px;
    border-radius: 3px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 1;
  `
  container.appendChild(posLabel)

  // Drop zone highlight
  const dropZone = document.createElement('div')
  dropZone.style.cssText = `
    position: fixed;
    background: rgba(99, 102, 241, 0.25);
    border: 2px dashed rgba(99, 102, 241, 0.7);
    border-radius: 3px;
    pointer-events: none;
    display: none;
    z-index: 0;
  `
  container.appendChild(dropZone)

  // ── Overlay positioning ──

  function positionOverlay() {
    if (!target) return

    const rect = target.getBoundingClientRect()

    // Grip handle — top-left of element
    gripHandle.style.left = `${rect.left - 20}px`
    gripHandle.style.top = `${rect.top}px`

    // Position label — bottom-right
    updatePositionLabel()
    posLabel.style.left = `${rect.right + 4}px`
    posLabel.style.top = `${rect.top}px`
  }

  function updatePositionLabel() {
    if (!target || !target.parentElement) {
      posLabel.textContent = ''
      return
    }
    const siblings = Array.from(target.parentElement.children)
    const index = siblings.indexOf(target)
    posLabel.textContent = `child ${index + 1} of ${siblings.length}`
  }

  function flashDropZone(el: Element) {
    const rect = el.getBoundingClientRect()
    dropZone.style.left = `${rect.left}px`
    dropZone.style.top = `${rect.top}px`
    dropZone.style.width = `${rect.width}px`
    dropZone.style.height = `${rect.height}px`
    dropZone.style.display = 'block'
    setTimeout(() => {
      dropZone.style.display = 'none'
    }, 300)
  }

  // ── DOM move helpers ──

  function saveSnapshot(): void {
    if (!target || !target.parentElement) return
    undoStack.push({
      element: target,
      parent: target.parentElement,
      nextSibling: target.nextSibling,
    })
  }

  function moveUp() {
    if (!target) return
    const prev = target.previousElementSibling
    if (!prev || !target.parentElement) return
    saveSnapshot()
    target.parentElement.insertBefore(target, prev)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function moveDown() {
    if (!target) return
    const next = target.nextElementSibling
    if (!next || !target.parentElement) return
    saveSnapshot()
    // Insert after next sibling = insert before next.nextSibling
    target.parentElement.insertBefore(target, next.nextSibling)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function moveToFirst() {
    if (!target || !target.parentElement) return
    const parent = target.parentElement
    if (parent.firstElementChild === target) return
    saveSnapshot()
    parent.insertBefore(target, parent.firstChild)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function moveToLast() {
    if (!target || !target.parentElement) return
    const parent = target.parentElement
    if (parent.lastElementChild === target) return
    saveSnapshot()
    parent.appendChild(target)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function promote() {
    if (!target) return
    const parent = target.parentElement
    if (!parent || !parent.parentElement) return
    saveSnapshot()
    parent.parentElement.insertBefore(target, parent)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function demote() {
    if (!target) return
    const prev = target.previousElementSibling
    if (!prev || !target.parentElement) return
    saveSnapshot()
    prev.appendChild(target)
    flashDropZone(target)
    positionOverlay()
    onUpdate?.()
  }

  function undoMove(): boolean {
    const snapshot = undoStack.pop()
    if (!snapshot) return false
    // Restore element to its previous position
    snapshot.parent.insertBefore(snapshot.element, snapshot.nextSibling)
    positionOverlay()
    onUpdate?.()
    return true
  }

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) {
          moveToFirst()
        } else {
          moveUp()
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) {
          moveToLast()
        } else {
          moveDown()
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        e.stopPropagation()
        promote()
        break
      case 'ArrowRight':
        e.preventDefault()
        e.stopPropagation()
        demote()
        break
      default:
        return
    }
  }

  // ── Scroll/resize tracking ──

  function onScrollOrResize() {
    positionOverlay()
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      container.style.display = ''
      positionOverlay()
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      dropZone.style.display = 'none'
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
    },

    undo: undoMove,
  }
}
