/**
 * Spacing Tool — Design Sub-Mode 2
 *
 * Webflow-style floating panel for margin/padding manipulation.
 * Uses Tailwind spacing scale for keyboard stepping.
 *
 * Features:
 * - Box model visualization with editable margin/padding values
 * - Link/unlink toggles for editing all sides simultaneously
 * - Arrow keys step through Tailwind spacing scale
 *   - Shift+arrow: larger jumps (3 positions in scale)
 *   - Alt+arrow: target margin (default is padding)
 *   - Cmd/Ctrl+arrow: adjust all four sides
 * - Focused input: ArrowUp/Down to increase/decrease value
 * - Box-sizing toggle (content-box / border-box)
 *
 * Reference: Webflow's spacing panel, SpacingSection component
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseValueWithUnit, resolveInputWithUnit } from './unitInput'
import styles from './spacingTool.css?inline'

// ── Types ──

type Edge = 'top' | 'right' | 'bottom' | 'left'
type SpacingType = 'margin' | 'padding'

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'] as const

const ARROW_TO_EDGE: Record<string, Edge> = {
  ArrowUp: 'top',
  ArrowDown: 'bottom',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/** Opposing edge pairs for Alt+drag */
const OPPOSING: Record<Edge, Edge> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const HANDLE_MIN_SIZE = 6

const UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const

// ── Tailwind Spacing Scale ──

const TAILWIND_SPACING: { label: string; px: number }[] = [
  { label: '0', px: 0 },
  { label: 'px', px: 1 },
  { label: '0.5', px: 2 },
  { label: '1', px: 4 },
  { label: '1.5', px: 6 },
  { label: '2', px: 8 },
  { label: '2.5', px: 10 },
  { label: '3', px: 12 },
  { label: '3.5', px: 14 },
  { label: '4', px: 16 },
  { label: '5', px: 20 },
  { label: '6', px: 24 },
  { label: '7', px: 28 },
  { label: '8', px: 32 },
  { label: '9', px: 36 },
  { label: '10', px: 40 },
  { label: '11', px: 44 },
  { label: '12', px: 48 },
  { label: '14', px: 56 },
  { label: '16', px: 64 },
  { label: '20', px: 80 },
  { label: '24', px: 96 },
]

const TW_PX_VALUES = TAILWIND_SPACING.map(s => s.px)

function findNearestTwIndex(px: number): number {
  let closest = 0
  let minDiff = Infinity
  for (let i = 0; i < TW_PX_VALUES.length; i++) {
    const diff = Math.abs(TW_PX_VALUES[i] - px)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }
  return closest
}

function stepTailwind(currentPx: number, direction: 1 | -1, large: boolean): number {
  const idx = findNearestTwIndex(currentPx)
  const step = large ? 3 : 1
  const nextIdx = Math.max(0, Math.min(TW_PX_VALUES.length - 1, idx + direction * step))
  return TW_PX_VALUES[nextIdx]
}

function pxToDisplayValue(px: number): string {
  const match = TAILWIND_SPACING.find(s => s.px === px)
  return match ? match.label : String(Math.round(px))
}

function parseInputValueWithUnit(input: string): { value: number; unit: string } {
  const trimmed = input.trim()
  if (!trimmed) return { value: 0, unit: 'px' }

  // Check if it's a Tailwind label
  const twMatch = TAILWIND_SPACING.find(s => s.label === trimmed)
  if (twMatch) return { value: twMatch.px, unit: 'px' }

  // Auto-resolve unit from typed value (e.g. "16rem", "2em", "50%")
  const parsed = parseValueWithUnit(trimmed, 'px')
  const num = parseFloat(parsed.value)
  return { value: isNaN(num) ? 0 : Math.max(0, num), unit: parsed.unit || 'px' }
}

function getElementLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const cls = el.classList.length > 0
    ? `.${[...el.classList].slice(0, 2).join('.')}`
    : ''
  return `${tag}${id}${cls}`
}

// ── Constants ──

const PICKER_MARGIN = 8

// ── SVG Icons ──

const SPACING_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1" stroke-dasharray="2 2"/></svg>'

const LINK_ICON = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'

const UNLINK_ICON = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .54 7.54"/><path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.54-7.54"/></svg>'

const BOX_CONTENT_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="12" height="12" rx="0.5" fill="currentColor" opacity="0.3"/></svg>'

const BOX_BORDER_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>'

// ── Exported Types ──

export interface SpacingToolOptions {
  /** Shadow root for rendering the spacing panel */
  shadowRoot: ShadowRoot
  /** Unified mutation engine for applying changes */
  engine: UnifiedMutationEngine
  /** Called when the tool produces a visual update */
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

// ── Tool Implementation ──

export function createSpacingTool(options: SpacingToolOptions): SpacingTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null
  let marginLinked = false
  let paddingLinked = false

  // Input refs for programmatic updates
  const inputs: Record<string, HTMLInputElement> = {}
  let marginLinkBtn: HTMLElement
  let paddingLinkBtn: HTMLElement
  let boxContentBtn: HTMLElement
  let boxBorderBtn: HTMLElement
  let marginUnitSelect: HTMLSelectElement
  let paddingUnitSelect: HTMLSelectElement
  let elementLabelEl: HTMLElement

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-sp'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Panel Header ──

  const header = document.createElement('div')
  header.className = 'flow-sp-header'

  const titleEl = document.createElement('span')
  titleEl.className = 'flow-sp-title'
  titleEl.textContent = 'Spacing'
  header.appendChild(titleEl)

  elementLabelEl = document.createElement('span')
  elementLabelEl.className = 'flow-sp-element-label'
  header.appendChild(elementLabelEl)

  const headerActions = document.createElement('div')
  headerActions.className = 'flow-sp-header-actions'

  const spacingBtn = document.createElement('div')
  spacingBtn.className = 'flow-sp-header-btn'
  spacingBtn.innerHTML = SPACING_ICON
  spacingBtn.title = 'Spacing mode'
  headerActions.appendChild(spacingBtn)

  const panelChevron = document.createElement('div')
  panelChevron.className = 'flow-sp-header-btn'
  panelChevron.textContent = '\u2228'
  headerActions.appendChild(panelChevron)

  header.appendChild(headerActions)
  container.appendChild(header)

  // ── Box Model Visualization ──

  const model = document.createElement('div')
  model.className = 'flow-sp-model'

  // Margin area (outer)
  const marginArea = document.createElement('div')
  marginArea.className = 'flow-sp-margin-area'

  const marginAreaHeader = document.createElement('div')
  marginAreaHeader.className = 'flow-sp-area-header'
  const marginLabel = document.createElement('span')
  marginLabel.className = 'flow-sp-area-label'
  marginLabel.textContent = 'MARGIN'
  marginAreaHeader.appendChild(marginLabel)
  marginUnitSelect = createUnitSelect()
  marginAreaHeader.appendChild(marginUnitSelect)
  marginArea.appendChild(marginAreaHeader)

  // Margin link toggle
  marginLinkBtn = document.createElement('button')
  marginLinkBtn.className = 'flow-sp-link-btn'
  marginLinkBtn.title = 'Link margin values'
  marginLinkBtn.innerHTML = UNLINK_ICON
  marginLinkBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    marginLinked = !marginLinked
    marginLinkBtn.innerHTML = marginLinked ? LINK_ICON : UNLINK_ICON
    marginLinkBtn.classList.toggle('active', marginLinked)
    marginLinkBtn.title = marginLinked ? 'Unlink margin values' : 'Link margin values'
  })
  marginArea.appendChild(marginLinkBtn)

  // Margin top
  marginArea.appendChild(createValueInput('margin', 'top'))

  // Margin sides row
  const marginSides = document.createElement('div')
  marginSides.className = 'flow-sp-margin-sides'

  marginSides.appendChild(createValueInput('margin', 'left'))

  // Padding area (nested inside margin)
  const paddingArea = document.createElement('div')
  paddingArea.className = 'flow-sp-padding-area'

  const paddingAreaHeader = document.createElement('div')
  paddingAreaHeader.className = 'flow-sp-area-header'
  const paddingLabel = document.createElement('span')
  paddingLabel.className = 'flow-sp-area-label'
  paddingLabel.textContent = 'PADDING'
  paddingAreaHeader.appendChild(paddingLabel)
  paddingUnitSelect = createUnitSelect()
  paddingAreaHeader.appendChild(paddingUnitSelect)
  paddingArea.appendChild(paddingAreaHeader)

  // Padding link toggle
  paddingLinkBtn = document.createElement('button')
  paddingLinkBtn.className = 'flow-sp-link-btn'
  paddingLinkBtn.title = 'Link padding values'
  paddingLinkBtn.innerHTML = UNLINK_ICON
  paddingLinkBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    paddingLinked = !paddingLinked
    paddingLinkBtn.innerHTML = paddingLinked ? LINK_ICON : UNLINK_ICON
    paddingLinkBtn.classList.toggle('active', paddingLinked)
    paddingLinkBtn.title = paddingLinked ? 'Unlink padding values' : 'Link padding values'
  })
  paddingArea.appendChild(paddingLinkBtn)

  // Padding top
  paddingArea.appendChild(createValueInput('padding', 'top'))

  // Padding sides row
  const paddingSides = document.createElement('div')
  paddingSides.className = 'flow-sp-padding-sides'

  paddingSides.appendChild(createValueInput('padding', 'left'))

  // Center element representation
  const elementCenter = document.createElement('div')
  elementCenter.className = 'flow-sp-element-center'
  const elementLine = document.createElement('div')
  elementLine.className = 'flow-sp-element-line'
  elementCenter.appendChild(elementLine)
  paddingSides.appendChild(elementCenter)

  paddingSides.appendChild(createValueInput('padding', 'right'))
  paddingArea.appendChild(paddingSides)

  // Padding bottom
  paddingArea.appendChild(createValueInput('padding', 'bottom'))

  marginSides.appendChild(paddingArea)
  marginSides.appendChild(createValueInput('margin', 'right'))
  marginArea.appendChild(marginSides)

  // Margin bottom
  marginArea.appendChild(createValueInput('margin', 'bottom'))

  model.appendChild(marginArea)
  container.appendChild(model)

  // ── Box Sizing Toggle ──

  const boxSizingRow = document.createElement('div')
  boxSizingRow.className = 'flow-sp-box-sizing'

  const boxLabel = document.createElement('span')
  boxLabel.className = 'flow-sp-box-label'
  boxLabel.textContent = 'Box size'
  boxSizingRow.appendChild(boxLabel)

  const boxToggle = document.createElement('div')
  boxToggle.className = 'flow-sp-box-toggle'

  boxContentBtn = document.createElement('div')
  boxContentBtn.className = 'flow-sp-box-btn'
  boxContentBtn.innerHTML = BOX_CONTENT_ICON
  boxContentBtn.title = 'content-box'
  boxContentBtn.addEventListener('click', () => setBoxSizing('content-box'))
  boxToggle.appendChild(boxContentBtn)

  boxBorderBtn = document.createElement('div')
  boxBorderBtn.className = 'flow-sp-box-btn'
  boxBorderBtn.innerHTML = BOX_BORDER_ICON
  boxBorderBtn.title = 'border-box'
  boxBorderBtn.addEventListener('click', () => setBoxSizing('border-box'))
  boxToggle.appendChild(boxBorderBtn)

  boxSizingRow.appendChild(boxToggle)
  container.appendChild(boxSizingRow)

  // ── Keyboard Hint ──

  const hint = document.createElement('div')
  hint.className = 'flow-sp-hint'
  hint.textContent = '\u2191\u2193\u2190\u2192 step TW scale \u00b7 Shift = skip \u00b7 Alt = margin \u00b7 \u2318 = all sides'
  container.appendChild(hint)

  // ── Overlay Handles (on-element visualization) ──

  const overlay = document.createElement('div')
  overlay.className = 'flow-sp-overlay'
  overlay.style.display = 'none'
  shadowRoot.appendChild(overlay)

  const handles = new Map<string, HTMLDivElement>()
  for (const type of ['margin', 'padding'] as const) {
    for (const edge of EDGES) {
      const handle = document.createElement('div')
      handle.className = 'flow-sp-handle'
      handle.dataset.type = type
      handle.dataset.edge = edge

      const isVertical = edge === 'top' || edge === 'bottom'
      handle.style.cursor = isVertical ? 'ns-resize' : 'ew-resize'

      setupDragHandler(handle, type, edge)
      handles.set(`${type}-${edge}`, handle)
      overlay.appendChild(handle)
    }
  }

  // Value label (shown on hover/drag)
  const valueLabel = document.createElement('div')
  valueLabel.className = 'flow-sp-value-label'
  overlay.appendChild(valueLabel)

  // ══════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════

  function createValueInput(type: SpacingType, edge: Edge): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'flow-sp-val'
    input.placeholder = '0'
    input.dataset.type = type
    input.dataset.edge = edge

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
      if (e.key === 'Escape') input.blur()

      // Arrow up/down in focused input: step value through TW scale
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        const direction: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1
        stepAndCommit(type, edge, direction, e.shiftKey)
        return
      }

      // Prevent other arrows from reaching the main keydown handler
      if (e.key.startsWith('Arrow')) e.stopPropagation()
    })

    input.addEventListener('blur', () => commitValue(type, edge, input))
    input.addEventListener('focus', () => input.select())

    inputs[`${type}-${edge}`] = input
    return input
  }

  function createUnitSelect(): HTMLSelectElement {
    const select = document.createElement('select')
    select.className = 'flow-sp-unit-select'
    for (const u of UNITS) {
      const opt = document.createElement('option')
      opt.value = u
      opt.textContent = u
      select.appendChild(opt)
    }
    select.value = 'px'
    select.addEventListener('mousedown', (e) => e.stopPropagation())
    select.addEventListener('keydown', (e) => e.stopPropagation())
    return select
  }

  function commitValue(type: SpacingType, edge: Edge, input: HTMLInputElement) {
    if (!target) return
    const unitSelect = type === 'margin' ? marginUnitSelect : paddingUnitSelect
    const resolved = resolveInputWithUnit(input, unitSelect, 'px')

    let cssVal: string
    if (resolved.unit === 'px' && !resolved.changed) {
      // px mode: interpret as TW label first, then raw px
      const parsed = parseInputValueWithUnit(input.value)
      cssVal = `${parsed.value}px`
    } else {
      // Other unit or user typed an embedded unit: use resolved value
      cssVal = !resolved.value || resolved.value === '0'
        ? '0px'
        : `${resolved.value}${resolved.unit}`
    }
    const isLinked = type === 'margin' ? marginLinked : paddingLinked

    if (isLinked) {
      const changes: Record<string, string> = {}
      for (const side of EDGES) {
        changes[`${type}-${side}`] = cssVal
      }
      engine.applyStyle(target, changes)
    } else {
      engine.applyStyle(target, { [`${type}-${edge}`]: cssVal })
    }

    readFromElement(target)
    positionHandles()
    onUpdate?.()
  }

  function stepAndCommit(type: SpacingType, edge: Edge, direction: 1 | -1, large: boolean) {
    if (!target) return
    const computed = getComputedStyle(target)
    const isLinked = type === 'margin' ? marginLinked : paddingLinked

    engine.beginBatch()

    if (isLinked) {
      for (const side of EDGES) {
        const current = parseFloat(computed.getPropertyValue(`${type}-${side}`)) || 0
        const newPx = stepTailwind(current, direction, large)
        engine.applyStyle(target, { [`${type}-${side}`]: `${newPx}px` })
      }
    } else {
      const current = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
      const newPx = stepTailwind(current, direction, large)
      engine.applyStyle(target, { [`${type}-${edge}`]: `${newPx}px` })
    }

    engine.commitBatch()
    readFromElement(target)
    positionHandles()
    onUpdate?.()
  }

  function setBoxSizing(value: 'content-box' | 'border-box') {
    if (!target) return
    engine.applyStyle(target, { 'box-sizing': value })
    updateBoxSizingUI(value)
    onUpdate?.()
  }

  function updateBoxSizingUI(value: string) {
    boxContentBtn.classList.toggle('active', value === 'content-box')
    boxBorderBtn.classList.toggle('active', value === 'border-box')
  }

  // ══════════════════════════════════════════════════════════
  // KEYBOARD
  // ══════════════════════════════════════════════════════════

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return

    // Don't intercept when an input in the panel is focused
    const activeEl = shadowRoot.activeElement
    if (activeEl?.tagName === 'INPUT') return

    const edge = ARROW_TO_EDGE[e.key]
    if (!edge) return

    e.preventDefault()
    e.stopPropagation()

    const type: SpacingType = e.altKey ? 'margin' : 'padding'
    const large = e.shiftKey

    engine.beginBatch()

    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl + arrow: adjust all four sides
      for (const side of EDGES) {
        applyStep(type, side, 1, large)
      }
    } else {
      applyStep(type, edge, 1, large)
    }

    engine.commitBatch()
    readFromElement(target)
    positionHandles()
    positionNearElement()
    onUpdate?.()
  }

  function applyStep(type: SpacingType, edge: Edge, direction: 1 | -1, large: boolean) {
    if (!target) return
    const property = `${type}-${edge}`
    const computed = getComputedStyle(target)
    const current = parseFloat(computed.getPropertyValue(property)) || 0
    const newPx = stepTailwind(current, direction, large)
    engine.applyStyle(target, { [property]: `${newPx}px` })
  }

  // ══════════════════════════════════════════════════════════
  // OVERLAY HANDLES — DRAG
  // ══════════════════════════════════════════════════════════

  function setupDragHandler(handle: HTMLDivElement, type: SpacingType, edge: Edge) {
    const DRAG_THRESHOLD = 3

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || !target) return
      // Don't stopPropagation or preventDefault yet — wait for drag threshold

      const startX = e.clientX
      const startY = e.clientY
      const computed = getComputedStyle(target)
      const isVertical = edge === 'top' || edge === 'bottom'
      const startValue = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
      const allStartValues: Record<Edge, number> = { top: 0, right: 0, bottom: 0, left: 0 }
      for (const side of EDGES) {
        allStartValues[side] = parseFloat(computed.getPropertyValue(`${type}-${side}`)) || 0
      }

      let isDragging = false

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX
        const dy = me.clientY - startY

        if (!isDragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
          // Threshold exceeded — start drag
          isDragging = true
          document.body.style.userSelect = 'none'
          handle.classList.add('dragging')
          engine.beginBatch()
        }

        if (!target) return

        let delta = isVertical ? dy : dx
        if (edge === 'top' || edge === 'left') delta = -delta

        if (me.shiftKey) {
          for (const side of EDGES) {
            const newVal = Math.max(0, allStartValues[side] + delta)
            target.style.setProperty(`${type}-${side}`, `${newVal}px`)
          }
        } else if (me.altKey) {
          const opposite = OPPOSING[edge]
          const newVal = Math.max(0, startValue + delta)
          const oppVal = Math.max(0, allStartValues[opposite] + delta)
          target.style.setProperty(`${type}-${edge}`, `${newVal}px`)
          target.style.setProperty(`${type}-${opposite}`, `${oppVal}px`)
        } else {
          const newVal = Math.max(0, startValue + delta)
          target.style.setProperty(`${type}-${edge}`, `${newVal}px`)
        }

        positionHandles()
        showValueLabel(type, edge)
      }

      const cleanup = () => {
        document.body.style.userSelect = ''
        handle.classList.remove('dragging')
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        window.removeEventListener('blur', onBlur)
        hideValueLabel()
      }

      const onUp = (me: MouseEvent) => {
        cleanup()

        if (!isDragging) {
          // Click-through: hide overlay so selection system finds the real element
          overlay.style.pointerEvents = 'none'
          for (const h of handles.values()) h.style.pointerEvents = 'none'

          const el = document.elementFromPoint(me.clientX, me.clientY)
          if (el) {
            el.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: me.clientX,
              clientY: me.clientY,
              composed: true,
              view: window,
            }))
          }

          requestAnimationFrame(() => {
            overlay.style.pointerEvents = ''
            for (const h of handles.values()) h.style.pointerEvents = ''
          })
          return
        }

        if (!target) {
          engine.cancelBatch()
          return
        }

        // Collect final values, reset inline styles, apply via engine
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
        readFromElement(target)
        positionHandles()
        onUpdate?.()
      }

      const onBlur = () => {
        cleanup()
        if (isDragging) {
          if (!target) {
            engine.cancelBatch()
          } else {
            engine.commitBatch()
            readFromElement(target)
            positionHandles()
            onUpdate?.()
          }
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      window.addEventListener('blur', onBlur, { once: true })
    })
  }

  // ══════════════════════════════════════════════════════════
  // OVERLAY HANDLES — POSITIONING
  // ══════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════
  // OVERLAY HANDLES — VALUE LABEL
  // ══════════════════════════════════════════════════════════

  function showValueLabel(type: SpacingType, edge: Edge) {
    if (!target) return
    const computed = getComputedStyle(target)
    const raw = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
    const display = pxToDisplayValue(raw)
    const rect = target.getBoundingClientRect()

    valueLabel.textContent = `${type}-${edge}: ${display}`
    valueLabel.style.display = 'block'

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

  function hideAllHandles() {
    for (const handle of handles.values()) {
      handle.style.display = 'none'
    }
    hideValueLabel()
  }

  // ══════════════════════════════════════════════════════════
  // READ STATE
  // ══════════════════════════════════════════════════════════

  function readFromElement(el: HTMLElement) {
    const computed = getComputedStyle(el)

    // Update element label and reset unit selects to px
    elementLabelEl.textContent = getElementLabel(el)
    marginUnitSelect.value = 'px'
    paddingUnitSelect.value = 'px'

    for (const type of ['margin', 'padding'] as const) {
      for (const edge of EDGES) {
        const property = `${type}-${edge}`
        const raw = parseFloat(computed.getPropertyValue(property)) || 0
        const input = inputs[`${type}-${edge}`]
        // Don't overwrite a focused input
        if (input && shadowRoot.activeElement !== input) {
          input.value = pxToDisplayValue(raw)
        }
      }
    }

    // Box sizing
    const boxSizingValue = computed.boxSizing || 'content-box'
    updateBoxSizingUI(boxSizingValue)
  }

  // ══════════════════════════════════════════════════════════
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    const rect = target.getBoundingClientRect()
    const pickerW = 260
    const pickerH = container.offsetHeight || 300

    let left = rect.left
    let top = rect.bottom + PICKER_MARGIN

    if (top + pickerH > window.innerHeight - PICKER_MARGIN) {
      top = rect.top - pickerH - PICKER_MARGIN
    }
    left = Math.max(PICKER_MARGIN, Math.min(left, window.innerWidth - pickerW - PICKER_MARGIN))
    top = Math.max(PICKER_MARGIN, top)

    container.style.left = `${left}px`
    container.style.top = `${top}px`
  }

  function onScrollOrResize() {
    positionNearElement()
    positionHandles()
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      readFromElement(element)
      container.style.display = ''
      overlay.style.display = ''
      positionNearElement()
      positionHandles()
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      overlay.style.display = 'none'
      hideAllHandles()
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
      overlay.remove()
      styleEl.remove()
    },
  }
}
