/**
 * Position Tool — Design Sub-Mode 1
 *
 * VisBug-style position manipulation tool. When active (Design → 1):
 * - Arrow keys nudge element position by 1px (Shift = 10px, Cmd/Ctrl = 100px)
 * - Auto-sets position: relative on static elements before nudging
 * - Drag to reposition: mousedown starts drag, mousemove updates left/top, mouseup commits
 * - Displays current top/left coordinates in a label near the element
 *
 * Uses the unified mutation engine for undo/redo and batch coalescing.
 *
 * Reference: VisBug's position/move tool
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'

// ── Types ──

type Direction = 'up' | 'down' | 'left' | 'right'

const ARROW_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export interface PositionToolOptions {
  /** Shadow root for rendering the position overlay */
  shadowRoot: ShadowRoot
  /** Unified mutation engine for applying changes */
  engine: UnifiedMutationEngine
  /** Called when the tool produces a visual update */
  onUpdate?: () => void
}

export interface PositionTool {
  /** Attach the tool to a target element */
  attach: (element: HTMLElement) => void
  /** Detach from the current element */
  detach: () => void
  /** Clean up all resources */
  destroy: () => void
}

// ── Tool Implementation ──

export function createPositionTool(options: PositionToolOptions): PositionTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // Overlay container
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Crosshair overlay — covers the element to show move cursor
  const crosshair = document.createElement('div')
  crosshair.style.cssText = `
    position: fixed;
    pointer-events: auto;
    cursor: move;
    border: 1px dashed rgba(100, 149, 237, 0.6);
    display: none;
  `
  container.appendChild(crosshair)

  // Position label (shows top/left values)
  const positionLabel = document.createElement('div')
  positionLabel.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font: 10px/1.3 ui-monospace, SFMono-Regular, monospace;
    padding: 2px 6px;
    border-radius: 3px;
    pointer-events: none;
    white-space: nowrap;
    display: none;
    z-index: 1;
  `
  container.appendChild(positionLabel)

  // ── Helpers ──

  function ensurePositioned() {
    if (!target) return
    const computed = getComputedStyle(target)
    const pos = computed.position
    if (pos === 'static' || pos === '') {
      engine.applyStyle(target, { position: 'relative' })
    }
  }

  function getCurrentOffset(): { top: number; left: number } {
    if (!target) return { top: 0, left: 0 }
    const computed = getComputedStyle(target)
    return {
      top: parseFloat(computed.top) || 0,
      left: parseFloat(computed.left) || 0,
    }
  }

  function updateOverlay() {
    if (!target) return
    const rect = target.getBoundingClientRect()

    // Position crosshair over element
    crosshair.style.left = `${rect.left}px`
    crosshair.style.top = `${rect.top}px`
    crosshair.style.width = `${rect.width}px`
    crosshair.style.height = `${rect.height}px`
    crosshair.style.display = 'block'

    // Position label above element
    const { top, left } = getCurrentOffset()
    positionLabel.textContent = `top: ${Math.round(top)}px, left: ${Math.round(left)}px`
    positionLabel.style.display = 'block'
    positionLabel.style.left = `${rect.left}px`
    positionLabel.style.top = `${rect.top - 20}px`
  }

  function hideOverlay() {
    crosshair.style.display = 'none'
    positionLabel.style.display = 'none'
  }

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    const direction = ARROW_TO_DIRECTION[e.key]
    if (!direction) return

    e.preventDefault()
    e.stopPropagation()

    let step = 1
    if (e.shiftKey) step = 10
    if (e.metaKey || e.ctrlKey) step = 100

    engine.beginBatch()
    ensurePositioned()

    const { top, left } = getCurrentOffset()

    switch (direction) {
      case 'up':
        engine.applyStyle(target, { top: `${top - step}px` })
        break
      case 'down':
        engine.applyStyle(target, { top: `${top + step}px` })
        break
      case 'left':
        engine.applyStyle(target, { left: `${left - step}px` })
        break
      case 'right':
        engine.applyStyle(target, { left: `${left + step}px` })
        break
    }

    engine.commitBatch()
    updateOverlay()
    onUpdate?.()
  }

  // ── Drag handler ──

  function setupDragHandler() {
    let startX = 0
    let startY = 0
    let startTop = 0
    let startLeft = 0

    crosshair.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!target) return

      ensurePositioned()

      const { top, left } = getCurrentOffset()
      startX = e.clientX
      startY = e.clientY
      startTop = top
      startLeft = left

      engine.beginBatch()

      const onMove = (me: MouseEvent) => {
        if (!target) return
        const dx = me.clientX - startX
        const dy = me.clientY - startY
        target.style.setProperty('top', `${startTop + dy}px`)
        target.style.setProperty('left', `${startLeft + dx}px`)
        updateOverlay()
      }

      const onUp = (me: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)

        if (!target) {
          engine.cancelBatch()
          return
        }

        // Capture final values, reset to start, then apply via engine
        const finalTop = target.style.getPropertyValue('top')
        const finalLeft = target.style.getPropertyValue('left')
        target.style.setProperty('top', `${startTop}px`)
        target.style.setProperty('left', `${startLeft}px`)

        engine.applyStyle(target, { top: finalTop, left: finalLeft })
        engine.commitBatch()
        updateOverlay()
        onUpdate?.()
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp, { once: true })
    })
  }

  setupDragHandler()

  // ── Scroll/resize tracking ──

  function onScrollOrResize() {
    updateOverlay()
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      container.style.display = ''
      updateOverlay()
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      hideOverlay()
      container.style.display = 'none'
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
  }
}
