/**
 * Flex Align Tool — Design Sub-Mode 3
 *
 * VisBug-style flex alignment manipulation tool. When active (Design → 3):
 * - Up/Down arrows: cycle justify-content
 * - Left/Right arrows: cycle align-items
 * - Cmd/Ctrl+Up/Down: toggle flex-direction (row ↔ column)
 * - Cmd/Ctrl+Left/Right: toggle flex-wrap (nowrap ↔ wrap)
 * - Shift+arrow: cycle align-self on the element itself
 * - Auto-sets display: flex on non-flex parents
 *
 * Uses the unified mutation engine for undo/redo.
 *
 * Reference: VisBug's flexbox tool
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'

// ── Value cycles ──

const JUSTIFY_VALUES = [
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
] as const

const ALIGN_VALUES = [
  'stretch',
  'flex-start',
  'center',
  'flex-end',
  'baseline',
] as const

// ── Types ──

export interface FlexToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface FlexTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Helpers ──

function cycleForward<T>(values: readonly T[], current: T): T {
  const idx = values.indexOf(current)
  return values[(idx + 1) % values.length]
}

function cycleBackward<T>(values: readonly T[], current: T): T {
  const idx = values.indexOf(current)
  return values[(idx - 1 + values.length) % values.length]
}

// ── Direction arrow for overlay ──

function directionArrow(dir: string): string {
  return dir === 'column' || dir === 'column-reverse' ? '↕' : '↔'
}

// ── Tool Implementation ──

export function createFlexTool(options: FlexToolOptions): FlexTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // Overlay container
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Info label
  const label = document.createElement('div')
  label.style.cssText = `
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
  container.appendChild(label)

  // ── Ensure parent is flex ──

  function ensureFlex(parent: HTMLElement): void {
    const display = getComputedStyle(parent).display
    if (display !== 'flex' && display !== 'inline-flex') {
      engine.applyStyle(parent, { display: 'flex' })
    }
  }

  // ── Overlay positioning ──

  function updateOverlay() {
    if (!target) {
      label.style.display = 'none'
      return
    }

    const parent = target.parentElement
    if (!parent) {
      label.style.display = 'none'
      return
    }

    const rect = target.getBoundingClientRect()
    const parentComputed = getComputedStyle(parent)
    const justify = parentComputed.justifyContent || 'flex-start'
    const align = parentComputed.alignItems || 'stretch'
    const dir = parentComputed.flexDirection || 'row'

    label.textContent = `${directionArrow(dir)} justify: ${justify} | align: ${align}`
    label.style.display = 'block'
    label.style.left = `${rect.left}px`
    label.style.top = `${rect.top - 20}px`
  }

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return

    const isArrow =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    if (!isArrow) return

    e.preventDefault()
    e.stopPropagation()

    const parent = target.parentElement
    if (!parent) return

    const meta = e.metaKey || e.ctrlKey

    if (meta) {
      // Cmd/Ctrl + Up/Down: toggle flex-direction
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        ensureFlex(parent)
        const current = getComputedStyle(parent).flexDirection || 'row'
        const next = current === 'column' ? 'row' : 'column'
        engine.applyStyle(parent, { 'flex-direction': next })
      }
      // Cmd/Ctrl + Left/Right: toggle flex-wrap
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        ensureFlex(parent)
        const current = getComputedStyle(parent).flexWrap || 'nowrap'
        const next = current === 'wrap' ? 'nowrap' : 'wrap'
        engine.applyStyle(parent, { 'flex-wrap': next })
      }
    } else if (e.shiftKey) {
      // Shift+arrow: cycle align-self on the element itself
      ensureFlex(parent)
      const current = getComputedStyle(target).alignSelf || 'auto'
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const next = cycleForward(ALIGN_VALUES, current as typeof ALIGN_VALUES[number])
        engine.applyStyle(target, { 'align-self': next })
      } else {
        const next = cycleBackward(ALIGN_VALUES, current as typeof ALIGN_VALUES[number])
        engine.applyStyle(target, { 'align-self': next })
      }
    } else {
      // Up/Down: cycle justify-content
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        ensureFlex(parent)
        const current = getComputedStyle(parent).justifyContent || 'flex-start'
        const next =
          e.key === 'ArrowUp'
            ? cycleForward(JUSTIFY_VALUES, current as typeof JUSTIFY_VALUES[number])
            : cycleBackward(JUSTIFY_VALUES, current as typeof JUSTIFY_VALUES[number])
        engine.applyStyle(parent, { 'justify-content': next })
      }
      // Left/Right: cycle align-items
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        ensureFlex(parent)
        const current = getComputedStyle(parent).alignItems || 'stretch'
        const next =
          e.key === 'ArrowRight'
            ? cycleForward(ALIGN_VALUES, current as typeof ALIGN_VALUES[number])
            : cycleBackward(ALIGN_VALUES, current as typeof ALIGN_VALUES[number])
        engine.applyStyle(parent, { 'align-items': next })
      }
    }

    updateOverlay()
    onUpdate?.()
  }

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
      label.style.display = 'none'
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
