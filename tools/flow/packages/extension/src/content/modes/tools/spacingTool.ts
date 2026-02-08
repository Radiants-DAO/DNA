/**
 * Spacing Tool — Design Sub-Mode 2
 *
 * VisBug-style spacing manipulation tool. When active (Design → 2):
 * - Arrow keys increment/decrement spacing by 1px (Shift = 10px)
 * - Drag handles on margin (orange) and padding (green) edges
 * - Shift+drag: all four sides simultaneously
 * - Alt+drag: opposing sides (top+bottom or left+right)
 * - Box model visualization overlay
 *
 * Uses the unified mutation engine for undo/redo and batch coalescing.
 *
 * Reference: VisBug's margin/padding tool
 * Reference: `packages/extension/src/content/overlays/spacingHandles.ts`
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'

// ── Types ──

type Edge = 'top' | 'right' | 'bottom' | 'left'
type SpacingType = 'margin' | 'padding'

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'] as const

/** Opposing edge pairs */
const OPPOSING: Record<Edge, Edge> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

/** Map arrow key → primary edge for the active spacing type */
const ARROW_TO_EDGE: Record<string, Edge> = {
  ArrowUp: 'top',
  ArrowDown: 'bottom',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export interface SpacingToolOptions {
  /** Shadow root for rendering the box model visualization */
  shadowRoot: ShadowRoot
  /** Unified mutation engine for applying changes */
  engine: UnifiedMutationEngine
  /** Called when the tool produces a visual update (repositioning overlays, etc.) */
  onUpdate?: () => void
}

export interface SpacingTool {
  /** Attach the tool to a target element */
  attach: (element: HTMLElement) => void
  /** Detach from the current element */
  detach: () => void
  /** Clean up all resources */
  destroy: () => void
}

// ── Colors ──

const MARGIN_COLOR = 'rgba(246, 178, 107, 0.55)'  // Orange
const MARGIN_HOVER = 'rgba(246, 178, 107, 0.8)'
const PADDING_COLOR = 'rgba(147, 196, 125, 0.55)' // Green
const PADDING_HOVER = 'rgba(147, 196, 125, 0.8)'

const HANDLE_MIN_SIZE = 6

// ── Tool Implementation ──

export function createSpacingTool(options: SpacingToolOptions): SpacingTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // Box model visualization container
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Create handle elements (8 total: 4 margin + 4 padding)
  const handles = new Map<string, HTMLDivElement>()
  for (const type of ['margin', 'padding'] as const) {
    for (const edge of EDGES) {
      const handle = document.createElement('div')
      handle.dataset.type = type
      handle.dataset.edge = edge

      const isVertical = edge === 'top' || edge === 'bottom'
      const baseColor = type === 'margin' ? MARGIN_COLOR : PADDING_COLOR
      const hoverColor = type === 'margin' ? MARGIN_HOVER : PADDING_HOVER

      handle.style.cssText = `
        position: fixed;
        pointer-events: auto;
        cursor: ${isVertical ? 'ns-resize' : 'ew-resize'};
        background: ${baseColor};
        transition: background 0.1s ease-out;
        display: none;
      `

      handle.addEventListener('mouseenter', () => {
        handle.style.background = hoverColor
      })
      handle.addEventListener('mouseleave', () => {
        handle.style.background = baseColor
      })

      setupDragHandler(handle, type, edge)
      handles.set(`${type}-${edge}`, handle)
      container.appendChild(handle)
    }
  }

  // Value labels (show px values on hover/drag)
  const valueLabel = document.createElement('div')
  valueLabel.style.cssText = `
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
  container.appendChild(valueLabel)

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    const edge = ARROW_TO_EDGE[e.key]
    if (!edge) return

    e.preventDefault()
    e.stopPropagation()

    const step = e.shiftKey ? 10 : 1
    // Default: adjust padding; Alt key switches to margin
    const type: SpacingType = e.altKey ? 'margin' : 'padding'

    engine.beginBatch()

    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl + arrow: adjust all four sides
      for (const side of EDGES) {
        adjustSpacing(type, side, step)
      }
    } else {
      adjustSpacing(type, edge, step)
    }

    engine.commitBatch()
    positionHandles()
    onUpdate?.()
  }

  function adjustSpacing(type: SpacingType, edge: Edge, delta: number) {
    if (!target) return
    const property = `${type}-${edge}`
    const computed = getComputedStyle(target)
    const current = parseFloat(computed.getPropertyValue(property)) || 0
    const newValue = Math.max(0, current + delta)
    engine.applyStyle(target, { [property]: `${newValue}px` })
  }

  // ── Handle drag ──

  function setupDragHandler(handle: HTMLDivElement, type: SpacingType, edge: Edge) {
    let startPos = 0
    let startValue = 0
    let allStartValues: Record<Edge, number> = { top: 0, right: 0, bottom: 0, left: 0 }

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (!target) return

      const computed = getComputedStyle(target)
      const isVertical = edge === 'top' || edge === 'bottom'
      startPos = isVertical ? e.clientY : e.clientX
      startValue = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0

      // Capture all four sides for Shift/Alt drag
      for (const side of EDGES) {
        allStartValues[side] = parseFloat(computed.getPropertyValue(`${type}-${side}`)) || 0
      }

      engine.beginBatch()

      const onMove = (me: MouseEvent) => {
        if (!target) return

        const isVert = edge === 'top' || edge === 'bottom'
        let delta = isVert
          ? me.clientY - startPos
          : me.clientX - startPos

        // Invert delta for top/left (dragging outward increases)
        if (edge === 'top' || edge === 'left') delta = -delta

        if (me.shiftKey) {
          // Shift: all four sides
          for (const side of EDGES) {
            const newVal = Math.max(0, allStartValues[side] + delta)
            target.style.setProperty(`${type}-${side}`, `${newVal}px`)
          }
        } else if (me.altKey) {
          // Alt: opposing sides
          const opposite = OPPOSING[edge]
          const newVal = Math.max(0, startValue + delta)
          const oppStart = allStartValues[opposite]
          const oppVal = Math.max(0, oppStart + delta)
          target.style.setProperty(`${type}-${edge}`, `${newVal}px`)
          target.style.setProperty(`${type}-${opposite}`, `${oppVal}px`)
        } else {
          // Normal: single side
          const newVal = Math.max(0, startValue + delta)
          target.style.setProperty(`${type}-${edge}`, `${newVal}px`)
        }

        positionHandles()
        showValueLabel(type, edge)
      }

      // Shared cleanup removes all drag listeners
      const cleanupDrag = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        window.removeEventListener('blur', onBlur)
        hideValueLabel()
      }

      const onUp = (me: MouseEvent) => {
        cleanupDrag()

        if (!target) {
          engine.cancelBatch()
          return
        }

        // Reset styles to pre-drag state, then apply via engine
        const changes: Record<string, string> = {}

        if (me.shiftKey) {
          for (const side of EDGES) {
            const prop = `${type}-${side}`
            const finalVal = target.style.getPropertyValue(prop)
            target.style.setProperty(prop, `${allStartValues[side]}px`)
            changes[prop] = finalVal
          }
        } else if (me.altKey) {
          const opposite = OPPOSING[edge]
          for (const side of [edge, opposite]) {
            const prop = `${type}-${side}`
            const finalVal = target.style.getPropertyValue(prop)
            target.style.setProperty(prop, `${allStartValues[side]}px`)
            changes[prop] = finalVal
          }
        } else {
          const prop = `${type}-${edge}`
          const finalVal = target.style.getPropertyValue(prop)
          target.style.setProperty(prop, `${startValue}px`)
          changes[prop] = finalVal
        }

        engine.applyStyle(target, changes)
        engine.commitBatch()
        positionHandles()
        onUpdate?.()
      }

      const onBlur = () => {
        cleanupDrag()
        if (!target) {
          engine.cancelBatch()
        } else {
          engine.commitBatch()
          positionHandles()
          onUpdate?.()
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp, { once: true })
      window.addEventListener('blur', onBlur, { once: true })
    })
  }

  // ── Handle positioning ──

  function positionHandles() {
    if (!target) return

    const rect = target.getBoundingClientRect()
    const computed = getComputedStyle(target)

    for (const type of ['margin', 'padding'] as const) {
      for (const edge of EDGES) {
        const handle = handles.get(`${type}-${edge}`)!
        const value = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0

        if (type === 'margin') {
          positionMarginHandle(handle, rect, edge, value)
        } else {
          positionPaddingHandle(handle, rect, edge, value)
        }
      }
    }
  }

  function positionMarginHandle(
    handle: HTMLDivElement,
    rect: DOMRect,
    edge: Edge,
    value: number
  ) {
    const size = Math.max(value, HANDLE_MIN_SIZE)
    handle.style.display = 'block'

    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`
        handle.style.top = `${rect.top - value}px`
        handle.style.width = `${rect.width}px`
        handle.style.height = `${size}px`
        break
      case 'bottom':
        handle.style.left = `${rect.left}px`
        handle.style.top = `${rect.bottom}px`
        handle.style.width = `${rect.width}px`
        handle.style.height = `${size}px`
        break
      case 'left':
        handle.style.left = `${rect.left - value}px`
        handle.style.top = `${rect.top}px`
        handle.style.width = `${size}px`
        handle.style.height = `${rect.height}px`
        break
      case 'right':
        handle.style.left = `${rect.right}px`
        handle.style.top = `${rect.top}px`
        handle.style.width = `${size}px`
        handle.style.height = `${rect.height}px`
        break
    }
  }

  function positionPaddingHandle(
    handle: HTMLDivElement,
    rect: DOMRect,
    edge: Edge,
    value: number
  ) {
    const size = Math.max(value, HANDLE_MIN_SIZE)
    handle.style.display = 'block'

    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`
        handle.style.top = `${rect.top}px`
        handle.style.width = `${rect.width}px`
        handle.style.height = `${size}px`
        break
      case 'bottom':
        handle.style.left = `${rect.left}px`
        handle.style.top = `${rect.bottom - size}px`
        handle.style.width = `${rect.width}px`
        handle.style.height = `${size}px`
        break
      case 'left':
        handle.style.left = `${rect.left}px`
        handle.style.top = `${rect.top}px`
        handle.style.width = `${size}px`
        handle.style.height = `${rect.height}px`
        break
      case 'right':
        handle.style.left = `${rect.right - size}px`
        handle.style.top = `${rect.top}px`
        handle.style.width = `${size}px`
        handle.style.height = `${rect.height}px`
        break
    }
  }

  // ── Value label ──

  function showValueLabel(type: SpacingType, edge: Edge) {
    if (!target) return
    const computed = getComputedStyle(target)
    const value = computed.getPropertyValue(`${type}-${edge}`)
    const rect = target.getBoundingClientRect()

    valueLabel.textContent = `${type}-${edge}: ${value}`
    valueLabel.style.display = 'block'

    // Position near the handle
    switch (edge) {
      case 'top':
        valueLabel.style.left = `${rect.left + rect.width / 2}px`
        valueLabel.style.top = `${rect.top - 24}px`
        break
      case 'bottom':
        valueLabel.style.left = `${rect.left + rect.width / 2}px`
        valueLabel.style.top = `${rect.bottom + 4}px`
        break
      case 'left':
        valueLabel.style.left = `${rect.left - 80}px`
        valueLabel.style.top = `${rect.top + rect.height / 2}px`
        break
      case 'right':
        valueLabel.style.left = `${rect.right + 4}px`
        valueLabel.style.top = `${rect.top + rect.height / 2}px`
        break
    }
  }

  function hideValueLabel() {
    valueLabel.style.display = 'none'
  }

  // ── Scroll/resize tracking ──

  function onScrollOrResize() {
    positionHandles()
  }

  function hideAllHandles() {
    for (const handle of handles.values()) {
      handle.style.display = 'none'
    }
    hideValueLabel()
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      container.style.display = ''
      positionHandles()
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      hideAllHandles()
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
