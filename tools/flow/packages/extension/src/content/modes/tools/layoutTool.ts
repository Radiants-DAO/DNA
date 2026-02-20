/**
 * Layout Tool — Design Sub-Mode 1
 *
 * Merged panel covering display mode, flex/grid controls, alignment,
 * gap, and spacing (margin + padding). Figma-inspired compact layout.
 *
 * Sections (top to bottom):
 * 1. Panel header (shared sub-mode switcher)
 * 2. Display mode icon tabs (flex-row, flex-col, grid, block) + overflow dropdown
 * 3. Alignment section (3x3 dot grid + X/Y dropdowns) — flex/grid only
 * 4. Flex-specific: wrap dropdown
 * 5. Grid-specific: cols/rows spinners, grid alignment
 * 6. Gap input(s) with lock toggle
 * 7. Spacing section: margin/padding tab, H/V or 4-side inputs, box-sizing
 *
 * Keyboard:
 * - Arrow keys navigate the 3x3 alignment grid (direction-aware)
 * - Shift+arrow cycles distribute/stretch values
 * - Cmd+↑↓ toggles flex-direction
 * - All arrows disabled when a panel input is focused
 *
 * On-element overlay:
 * - 4 padding drag handles (default), Alt switches to margin
 * - Drag modifiers: Shift=all sides, Alt=opposing pair
 *
 * Uses the unified mutation engine for undo/redo.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseValueWithUnit } from './unitInput'
import { createToolPanelHeader } from './toolPanelHeader'
import { stepTailwind, pxToDisplayValue, TAILWIND_SPACING } from './spacingScale'
import { attachScrub } from './scrubLabel'
import styles from './layoutTool.css?inline'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'

// ── Types ──

type DisplayType = 'block' | 'flex' | 'grid' | 'none'
type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'
type Edge = 'top' | 'right' | 'bottom' | 'left'
type SpacingType = 'margin' | 'padding'

export interface LayoutToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface LayoutTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Constants ──

import { computeToolPanelPosition } from './toolPanelPosition'

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'] as const

/** Opposing edge pairs for Alt+drag */
const OPPOSING: Record<Edge, Edge> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const HANDLE_MIN_SIZE = 6

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

const DIRECTION_ICONS: Record<FlexDirection, string> = {
  row: '\u2192',
  column: '\u2193',
  'row-reverse': '\u2190',
  'column-reverse': '\u2191',
}

const FLEX_DIRECTIONS: FlexDirection[] = ['row', 'column', 'row-reverse', 'column-reverse']
const WRAP_OPTIONS: FlexWrap[] = ['nowrap', 'wrap', 'wrap-reverse']

const DISPLAY_TABS: DisplayType[] = ['block', 'flex', 'grid', 'none']

const DISPLAY_ICONS: Record<DisplayType, string> = {
  block: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2" width="11" height="4" rx="0.5"/><rect x="1.5" y="8" width="11" height="4" rx="0.5"/></svg>',
  flex: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3" width="3" height="8" rx="0.5"/><rect x="5.5" y="3" width="3" height="8" rx="0.5"/><rect x="9.5" y="3" width="3" height="8" rx="0.5"/></svg>',
  grid: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="1.5" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="1.5" width="4.5" height="4.5" rx="0.5"/><rect x="1.5" y="8" width="4.5" height="4.5" rx="0.5"/><rect x="8" y="8" width="4.5" height="4.5" rx="0.5"/></svg>',
  none: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="10" height="10" rx="1" stroke-dasharray="2 2"/><line x1="2" y1="2" x2="12" y2="12"/></svg>',
}

const DOT_POSITIONS = [14, 36, 58]

const JUSTIFY_OPTIONS: { value: string; label: string }[] = [
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'space-between', label: 'Space Between' },
  { value: 'space-around', label: 'Space Around' },
  { value: 'space-evenly', label: 'Space Evenly' },
]

const ALIGN_OPTIONS: { value: string; label: string }[] = [
  { value: 'stretch', label: 'Stretch' },
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'baseline', label: 'Baseline' },
]

// ── Helpers ──

function resolveDisplayType(computed: string): DisplayType {
  if (computed === 'flex' || computed === 'inline-flex') return 'flex'
  if (computed === 'grid' || computed === 'inline-grid') return 'grid'
  if (computed === 'none') return 'none'
  return 'block'
}

function isInlineDisplay(computed: string): boolean {
  return computed === 'inline' || computed === 'inline-block' ||
    computed === 'inline-flex' || computed === 'inline-grid'
}

// ── Unit System ──

const SPACING_UNITS = ['tw', 'px', 'rem', 'em', '%', 'vw', 'vh'] as const
type SpacingUnit = (typeof SPACING_UNITS)[number]

const UNIT_STEPS: Record<string, { normal: number; large: number }> = {
  tw: { normal: 1, large: 3 },
  px: { normal: 1, large: 10 },
  rem: { normal: 0.125, large: 0.5 },
  em: { normal: 0.125, large: 0.5 },
  '%': { normal: 1, large: 10 },
  vw: { normal: 1, large: 10 },
  vh: { normal: 1, large: 10 },
}

function getRootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
}

function pxToUnitValue(px: number, unit: string, el: HTMLElement): number {
  switch (unit) {
    case 'tw': return px
    case 'px': return px
    case 'rem': return px / getRootFontSize()
    case 'em': return px / (parseFloat(getComputedStyle(el).fontSize) || 16)
    case '%': {
      const parent = el.parentElement
      if (!parent) return px
      return (px / (parent.getBoundingClientRect().width || 1)) * 100
    }
    case 'vw': return (px / window.innerWidth) * 100
    case 'vh': return (px / window.innerHeight) * 100
    default: return px
  }
}

function unitValueToPx(value: number, unit: string, el: HTMLElement): number {
  switch (unit) {
    case 'tw': return value
    case 'px': return value
    case 'rem': return value * getRootFontSize()
    case 'em': return value * (parseFloat(getComputedStyle(el).fontSize) || 16)
    case '%': {
      const parent = el.parentElement
      if (!parent) return value
      return (value / 100) * (parent.getBoundingClientRect().width || 1)
    }
    case 'vw': return (value / 100) * window.innerWidth
    case 'vh': return (value / 100) * window.innerHeight
    default: return value
  }
}

function formatUnitNum(val: number, unit: SpacingUnit): string {
  if (unit === 'px') return String(Math.round(val))
  const rounded = Math.round(val * 1000) / 1000
  return rounded === Math.floor(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function readPxFormatted(px: number, unit: SpacingUnit, el: HTMLElement): string {
  if (unit === 'tw') return pxToDisplayValue(px)
  const val = pxToUnitValue(px, unit, el)
  return formatUnitNum(val, unit)
}

function stepSpacingDisplay(currentDisplay: string, direction: 1 | -1, shift: boolean, unit: SpacingUnit): string {
  if (unit === 'tw') {
    const match = TAILWIND_SPACING.find(s => s.label === currentDisplay.trim())
    const px = match ? match.px : (parseFloat(currentDisplay) || 0)
    const newPx = stepTailwind(px, direction, shift)
    return pxToDisplayValue(newPx)
  }
  const current = parseFloat(currentDisplay) || 0
  const steps = UNIT_STEPS[unit] || UNIT_STEPS.px
  const step = shift ? steps.large : steps.normal
  const newVal = Math.max(0, current + direction * step)
  return formatUnitNum(newVal, unit)
}

function displayToCss(displayValue: string, unit: SpacingUnit): string {
  if (unit === 'tw') {
    const match = TAILWIND_SPACING.find(s => s.label === displayValue.trim())
    const px = match ? match.px : (parseFloat(displayValue) || 0)
    return `${Math.round(px)}px`
  }
  const num = parseFloat(displayValue) || 0
  if (unit === 'px') return `${Math.round(num)}px`
  return `${num}${unit}`
}

function pxToCssInUnit(px: number, unit: SpacingUnit, el: HTMLElement): string {
  if (unit === 'tw' || unit === 'px') return `${Math.round(px)}px`
  const unitVal = pxToUnitValue(px, unit, el)
  const rounded = Math.round(unitVal * 1000) / 1000
  return `${rounded}${unit}`
}

function detectSpacingUnit(el: HTMLElement, type: SpacingType): SpacingUnit {
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    const val = el.style.getPropertyValue(`${type}-${edge}`)
    if (!val) continue
    if (val.includes('rem')) return 'rem'
    if (val.includes('em') && !val.includes('rem')) return 'em'
    if (val.includes('%')) return '%'
    if (val.includes('vw')) return 'vw'
    if (val.includes('vh')) return 'vh'
  }
  const computed = getComputedStyle(el)
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    const px = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
    if (px > 0 && !TAILWIND_SPACING.some(s => s.px === px)) return 'px'
  }
  return 'tw'
}

function getElementLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  if (el.id) return `${tag}#${el.id}`
  const cls = el.className
  if (typeof cls === 'string' && cls.trim()) {
    const first = cls.trim().split(/\s+/)[0]
    if (first.length < 24) return `${tag}.${first}`
  }
  return tag
}

// ── Tool Implementation ──

export function createLayoutTool(options: LayoutToolOptions): LayoutTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null
  let currentDisplay: DisplayType = 'block'
  let currentInline = false
  let currentDirection: FlexDirection = 'row'
  let currentWrap: FlexWrap = 'nowrap'
  let currentJustify = 'flex-start'
  let currentAlign = 'stretch'
  let currentGap = 0
  let currentGapUnit = 'px'
  let gapLocked = true
  let currentGridCols = 2
  let currentGridRows = 2
  let wrapDropdownOpen = false
  let overflowDropdownOpen = false

  // ── Spacing state ──
  let activeSpacingType: SpacingType = 'padding'
  let spacingExpanded = false // false = H/V mode, true = 4-side mode
  let spacingUnit: SpacingUnit = 'tw'

  // ── Grab bar / detach state ──
  let isDetached = false
  let grabDragStartX = 0
  let grabDragStartY = 0
  let panelStartLeft = 0
  let panelStartTop = 0

  // UI refs
  const tabBtns: Record<DisplayType, HTMLElement> = {} as Record<DisplayType, HTMLElement>
  const dirBtns: Record<FlexDirection, HTMLElement> = {} as Record<FlexDirection, HTMLElement>
  let flexSection: HTMLElement
  let gridSection: HTMLElement
  let blockSection: HTMLElement
  let noneSection: HTMLElement
  let justifySelect: HTMLSelectElement
  let alignSelect: HTMLSelectElement
  let gapSlider: HTMLInputElement
  let gapInput: HTMLInputElement
  let gapLockBtn: HTMLElement
  let wrapTriggerText: HTMLElement
  let wrapMenuEl: HTMLElement
  let overflowTrigger: HTMLElement
  let overflowMenuEl: HTMLElement
  let gridColsInput: HTMLInputElement
  let gridRowsInput: HTMLInputElement
  const alignBars: HTMLElement[] = []
  const alignDots: HTMLElement[] = []
  let grabBar: HTMLElement
  let elementNameEl: HTMLElement
  let spacingUnitSelect: HTMLSelectElement

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-layout'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Grab Bar (draggable panel header with element name) ──

  grabBar = document.createElement('div')
  grabBar.className = 'flow-layout-grab-bar'

  // Dot grip pattern (2x3)
  const grabDots = document.createElement('div')
  grabDots.className = 'flow-layout-grab-dots'
  for (let r = 0; r < 3; r++) {
    const row = document.createElement('div')
    row.className = 'flow-layout-grab-dot-row'
    row.innerHTML = '<span></span><span></span>'
    grabDots.appendChild(row)
  }
  grabBar.appendChild(grabDots)

  elementNameEl = document.createElement('span')
  elementNameEl.className = 'flow-layout-element-name'
  elementNameEl.textContent = ''
  grabBar.appendChild(elementNameEl)

  const detachIndicator = document.createElement('span')
  detachIndicator.className = 'flow-layout-detach-indicator'
  detachIndicator.textContent = '\u{1F4CC}'
  detachIndicator.title = 'Double-click to toggle auto-position'
  grabBar.appendChild(detachIndicator)

  // Drag logic
  grabBar.addEventListener('mousedown', onGrabStart)
  grabBar.addEventListener('dblclick', (e) => {
    e.stopPropagation()
    isDetached = !isDetached
    container.classList.toggle('detached', isDetached)
    if (!isDetached) positionNearElement()
  })

  container.appendChild(grabBar)

  // ── Panel Header (shared sub-mode switcher) ──

  const toolHeader = createToolPanelHeader({
    shadowRoot,
    currentModeId: 'layout',
  })
  container.appendChild(toolHeader.header)

  // ── Display Row ──

  const displayRow = document.createElement('div')
  displayRow.className = 'flow-layout-display-row'

  const displayLabel = document.createElement('span')
  displayLabel.className = 'flow-layout-display-label'
  displayLabel.textContent = 'Display'
  displayRow.appendChild(displayLabel)

  // Tabs
  const tabsContainer = document.createElement('div')
  tabsContainer.className = 'flow-layout-tabs'

  for (const type of DISPLAY_TABS) {
    const tab = document.createElement('div')
    tab.className = 'flow-layout-tab'
    tab.innerHTML = DISPLAY_ICONS[type]
    tab.title = type.charAt(0).toUpperCase() + type.slice(1)
    tab.addEventListener('click', (e) => {
      e.stopPropagation()
      setDisplayType(type, false)
    })
    tabsContainer.appendChild(tab)
    tabBtns[type] = tab
  }

  displayRow.appendChild(tabsContainer)

  // Overflow dropdown (inline variants)
  const overflow = document.createElement('div')
  overflow.className = 'flow-layout-overflow'

  overflowTrigger = document.createElement('div')
  overflowTrigger.className = 'flow-layout-overflow-trigger'
  overflowTrigger.textContent = '\u25be'
  overflowTrigger.title = 'Inline display variants'
  overflowTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleOverflowDropdown()
  })
  overflow.appendChild(overflowTrigger)

  overflowMenuEl = document.createElement('div')
  overflowMenuEl.className = 'flow-layout-overflow-menu'

  const inlineOptions = ['inline', 'inline-block', 'inline-flex', 'inline-grid']
  for (const opt of inlineOptions) {
    const item = document.createElement('div')
    item.className = 'flow-layout-overflow-item'
    item.textContent = opt
    item.dataset.display = opt
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      applyInlineDisplay(opt)
      closeOverflowDropdown()
    })
    overflowMenuEl.appendChild(item)
  }

  overflow.appendChild(overflowMenuEl)
  displayRow.appendChild(overflow)
  container.appendChild(displayRow)

  // ══════════════════════════════════════════════════════════
  // FLEX SECTION
  // ══════════════════════════════════════════════════════════

  flexSection = document.createElement('div')
  flexSection.className = 'flow-layout-section'
  flexSection.style.display = 'none'

  // Direction row
  const dirRow = document.createElement('div')
  dirRow.className = 'flow-layout-direction-row'

  const dirLabel = document.createElement('span')
  dirLabel.className = 'flow-layout-section-label'
  dirLabel.textContent = 'Direction'
  dirRow.appendChild(dirLabel)

  const dirBtnsContainer = document.createElement('div')
  dirBtnsContainer.className = 'flow-layout-dir-btns'

  for (const dir of FLEX_DIRECTIONS) {
    const btn = document.createElement('div')
    btn.className = 'flow-layout-dir-btn'
    btn.textContent = DIRECTION_ICONS[dir]
    btn.title = dir
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      setDirection(dir)
    })
    dirBtnsContainer.appendChild(btn)
    dirBtns[dir] = btn
  }

  dirRow.appendChild(dirBtnsContainer)

  // Wrap dropdown
  const wrapDropdown = document.createElement('div')
  wrapDropdown.className = 'flow-layout-wrap-dropdown'

  const wrapTrigger = document.createElement('div')
  wrapTrigger.className = 'flow-layout-wrap-trigger'

  wrapTriggerText = document.createElement('span')
  wrapTriggerText.textContent = 'No wrap'
  wrapTrigger.appendChild(wrapTriggerText)

  const wrapChevron = document.createElement('span')
  wrapChevron.className = 'flow-layout-wrap-chevron'
  wrapChevron.textContent = '\u25be'
  wrapTrigger.appendChild(wrapChevron)

  wrapTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleWrapDropdown()
  })
  wrapDropdown.appendChild(wrapTrigger)

  wrapMenuEl = document.createElement('div')
  wrapMenuEl.className = 'flow-layout-wrap-menu'

  for (const w of WRAP_OPTIONS) {
    const item = document.createElement('div')
    item.className = 'flow-layout-wrap-item'
    item.textContent = w === 'nowrap' ? 'No wrap' : w.charAt(0).toUpperCase() + w.slice(1)
    item.dataset.wrap = w
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      setWrap(w)
      closeWrapDropdown()
    })
    wrapMenuEl.appendChild(item)
  }

  wrapDropdown.appendChild(wrapMenuEl)
  dirRow.appendChild(wrapDropdown)
  flexSection.appendChild(dirRow)

  // Alignment row
  const alignRow = document.createElement('div')
  alignRow.className = 'flow-layout-align-row'

  // Alignment preview grid with 3 bars + 9 clickable dots
  const alignGrid = document.createElement('div')
  alignGrid.className = 'flow-layout-align-grid'

  for (let i = 0; i < 3; i++) {
    const bar = document.createElement('div')
    bar.className = 'flow-layout-align-bar'
    alignGrid.appendChild(bar)
    alignBars.push(bar)
  }

  // 3x3 dot grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const dot = document.createElement('div')
      dot.className = 'flow-layout-align-dot'
      dot.style.left = `${DOT_POSITIONS[col]}px`
      dot.style.top = `${DOT_POSITIONS[row]}px`
      dot.addEventListener('click', (e) => {
        e.stopPropagation()
        handleDotClick(col, row, e)
      })
      alignGrid.appendChild(dot)
      alignDots.push(dot)
    }
  }

  alignRow.appendChild(alignGrid)

  // Alignment controls (X/Y dropdowns, populated by rebuildDropdowns)
  const alignControls = document.createElement('div')
  alignControls.className = 'flow-layout-align-controls'

  // X dropdown
  const justifyControl = document.createElement('div')
  justifyControl.className = 'flow-layout-align-control'

  const justifyLabel = document.createElement('span')
  justifyLabel.className = 'flow-layout-align-label'
  justifyLabel.textContent = 'X'
  justifyControl.appendChild(justifyLabel)

  justifySelect = document.createElement('select')
  justifySelect.className = 'flow-layout-select'
  justifySelect.addEventListener('change', () => {
    setXValue(justifySelect.value)
  })
  justifySelect.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  justifyControl.appendChild(justifySelect)
  alignControls.appendChild(justifyControl)

  // Y dropdown
  const alignControl = document.createElement('div')
  alignControl.className = 'flow-layout-align-control'

  const alignLabel = document.createElement('span')
  alignLabel.className = 'flow-layout-align-label'
  alignLabel.textContent = 'Y'
  alignControl.appendChild(alignLabel)

  alignSelect = document.createElement('select')
  alignSelect.className = 'flow-layout-select'
  alignSelect.addEventListener('change', () => {
    setYValue(alignSelect.value)
  })
  alignSelect.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  alignControl.appendChild(alignSelect)
  alignControls.appendChild(alignControl)

  alignRow.appendChild(alignControls)
  flexSection.appendChild(alignRow)

  // Gap row
  const gapRow = document.createElement('div')
  gapRow.className = 'flow-layout-gap-row'

  const gapLabel = document.createElement('span')
  gapLabel.className = 'flow-layout-section-label'
  gapLabel.textContent = 'Gap'
  gapRow.appendChild(gapLabel)

  gapSlider = document.createElement('input')
  gapSlider.type = 'range'
  gapSlider.min = '0'
  gapSlider.max = '100'
  gapSlider.value = '0'
  gapSlider.className = 'flow-layout-gap-slider'
  gapSlider.addEventListener('input', () => {
    currentGap = parseInt(gapSlider.value)
    gapInput.value = String(currentGap)
    commitGap()
  })
  gapRow.appendChild(gapSlider)

  gapInput = document.createElement('input')
  gapInput.type = 'text'
  gapInput.className = 'flow-layout-gap-input'
  gapInput.value = '0'
  gapInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') gapInput.blur()
    if (e.key === 'Escape') gapInput.blur()
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  gapInput.addEventListener('blur', () => {
    const parsed = parseValueWithUnit(gapInput.value, 'px')
    const val = parseInt(parsed.value) || 0
    currentGap = Math.max(0, Math.min(val, 200))
    currentGapUnit = parsed.unit || 'px'
    gapInput.value = String(currentGap)
    gapSlider.value = String(Math.min(currentGap, 100))
    gapUnit.textContent = currentGapUnit.toUpperCase()
    commitGap()
  })
  gapInput.addEventListener('focus', () => gapInput.select())
  gapRow.appendChild(gapInput)

  const gapUnit = document.createElement('span')
  gapUnit.className = 'flow-layout-gap-unit'
  gapUnit.textContent = 'PX'
  gapRow.appendChild(gapUnit)

  gapLockBtn = document.createElement('div')
  gapLockBtn.className = 'flow-layout-gap-lock locked'
  gapLockBtn.textContent = '\ud83d\udd12'
  gapLockBtn.title = 'Lock row/column gap'
  gapLockBtn.addEventListener('click', () => {
    gapLocked = !gapLocked
    gapLockBtn.classList.toggle('locked', gapLocked)
    gapLockBtn.textContent = gapLocked ? '\ud83d\udd12' : '\ud83d\udd13'
  })
  gapRow.appendChild(gapLockBtn)

  flexSection.appendChild(gapRow)

  // Info text
  const flexInfo = document.createElement('div')
  flexInfo.className = 'flow-layout-info'

  const flexInfoIcon = document.createElement('span')
  flexInfoIcon.className = 'flow-layout-info-icon'
  flexInfoIcon.textContent = '\u2139'
  flexInfo.appendChild(flexInfoIcon)

  const flexInfoText = document.createElement('span')
  flexInfoText.textContent = 'Flex layout settings affect an element\u2019s children.'
  flexInfo.appendChild(flexInfoText)

  flexSection.appendChild(flexInfo)
  container.appendChild(flexSection)

  // ══════════════════════════════════════════════════════════
  // GRID SECTION
  // ══════════════════════════════════════════════════════════

  gridSection = document.createElement('div')
  gridSection.className = 'flow-layout-section'
  gridSection.style.display = 'none'

  // Grid size row
  const gridRow = document.createElement('div')
  gridRow.className = 'flow-layout-grid-row'

  const gridLabel = document.createElement('span')
  gridLabel.className = 'flow-layout-section-label'
  gridLabel.textContent = 'Grid'
  gridRow.appendChild(gridLabel)

  // Cols spinner
  const colSpinner = createSpinner(2, (val) => {
    currentGridCols = val
    commitGrid()
  })
  gridColsInput = colSpinner.input
  gridRow.appendChild(colSpinner.el)

  const gridX = document.createElement('span')
  gridX.className = 'flow-layout-grid-x'
  gridX.textContent = '\u00d7'
  gridRow.appendChild(gridX)

  // Rows spinner
  const rowSpinner = createSpinner(2, (val) => {
    currentGridRows = val
    commitGrid()
  })
  gridRowsInput = rowSpinner.input
  gridRow.appendChild(rowSpinner.el)

  const colsLabel = document.createElement('span')
  colsLabel.className = 'flow-layout-grid-label'
  colsLabel.textContent = 'Cols'
  gridRow.appendChild(colsLabel)

  const rowsLabel = document.createElement('span')
  rowsLabel.className = 'flow-layout-grid-label'
  rowsLabel.textContent = 'Rows'
  gridRow.appendChild(rowsLabel)

  gridSection.appendChild(gridRow)

  // Grid alignment (reuse same justify/align pattern)
  const gridAlignRow = document.createElement('div')
  gridAlignRow.className = 'flow-layout-align-row'

  const gridAlignControls = document.createElement('div')
  gridAlignControls.className = 'flow-layout-align-controls'

  // justify-items for grid
  const gridJustifyControl = document.createElement('div')
  gridJustifyControl.className = 'flow-layout-align-control'
  const gridJustifyLabel = document.createElement('span')
  gridJustifyLabel.className = 'flow-layout-align-label'
  gridJustifyLabel.textContent = 'X'
  gridJustifyControl.appendChild(gridJustifyLabel)

  const gridJustifySelect = document.createElement('select')
  gridJustifySelect.className = 'flow-layout-select'
  for (const v of ['start', 'center', 'end', 'stretch']) {
    const opt = document.createElement('option')
    opt.value = v
    opt.textContent = v
    gridJustifySelect.appendChild(opt)
  }
  gridJustifySelect.addEventListener('change', () => {
    if (!target) return
    engine.applyStyle(target, { 'justify-items': gridJustifySelect.value })
    onUpdate?.()
  })
  gridJustifySelect.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  gridJustifyControl.appendChild(gridJustifySelect)
  gridAlignControls.appendChild(gridJustifyControl)

  // align-items for grid
  const gridAlignControl = document.createElement('div')
  gridAlignControl.className = 'flow-layout-align-control'
  const gridAlignLabel = document.createElement('span')
  gridAlignLabel.className = 'flow-layout-align-label'
  gridAlignLabel.textContent = 'Y'
  gridAlignControl.appendChild(gridAlignLabel)

  const gridAlignSelect = document.createElement('select')
  gridAlignSelect.className = 'flow-layout-select'
  for (const v of ['start', 'center', 'end', 'stretch']) {
    const opt = document.createElement('option')
    opt.value = v
    opt.textContent = v
    gridAlignSelect.appendChild(opt)
  }
  gridAlignSelect.addEventListener('change', () => {
    if (!target) return
    engine.applyStyle(target, { 'align-items': gridAlignSelect.value })
    onUpdate?.()
  })
  gridAlignSelect.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  gridAlignControl.appendChild(gridAlignSelect)
  gridAlignControls.appendChild(gridAlignControl)

  gridAlignRow.appendChild(gridAlignControls)
  gridSection.appendChild(gridAlignRow)

  // Grid gap row
  const gridGapRow = document.createElement('div')
  gridGapRow.className = 'flow-layout-gap-row'

  const gridGapLabel = document.createElement('span')
  gridGapLabel.className = 'flow-layout-section-label'
  gridGapLabel.textContent = 'Gap'
  gridGapRow.appendChild(gridGapLabel)

  const gridGapSlider = document.createElement('input')
  gridGapSlider.type = 'range'
  gridGapSlider.min = '0'
  gridGapSlider.max = '100'
  gridGapSlider.value = '0'
  gridGapSlider.className = 'flow-layout-gap-slider'

  const gridGapInput = document.createElement('input')
  gridGapInput.type = 'text'
  gridGapInput.className = 'flow-layout-gap-input'
  gridGapInput.value = '0'

  gridGapSlider.addEventListener('input', () => {
    gridGapInput.value = gridGapSlider.value
    if (!target) return
    engine.applyStyle(target, { gap: `${gridGapSlider.value}px` })
    onUpdate?.()
  })

  gridGapInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') gridGapInput.blur()
    if (e.key === 'Escape') gridGapInput.blur()
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  gridGapInput.addEventListener('blur', () => {
    const parsed = parseValueWithUnit(gridGapInput.value, 'px')
    const val = Math.max(0, Math.min(parseInt(parsed.value) || 0, 200))
    const unit = parsed.unit || 'px'
    gridGapInput.value = String(val)
    gridGapSlider.value = String(Math.min(val, 100))
    gridGapUnit.textContent = unit.toUpperCase()
    if (!target) return
    engine.applyStyle(target, { gap: `${val}${unit}` })
    onUpdate?.()
  })
  gridGapInput.addEventListener('focus', () => gridGapInput.select())

  gridGapRow.appendChild(gridGapSlider)
  gridGapRow.appendChild(gridGapInput)

  const gridGapUnit = document.createElement('span')
  gridGapUnit.className = 'flow-layout-gap-unit'
  gridGapUnit.textContent = 'PX'
  gridGapRow.appendChild(gridGapUnit)

  gridSection.appendChild(gridGapRow)

  // Grid info
  const gridInfo = document.createElement('div')
  gridInfo.className = 'flow-layout-info'
  const gridInfoIcon = document.createElement('span')
  gridInfoIcon.className = 'flow-layout-info-icon'
  gridInfoIcon.textContent = '\u2139'
  gridInfo.appendChild(gridInfoIcon)
  const gridInfoText = document.createElement('span')
  gridInfoText.textContent = 'Grid layout arranges children in rows and columns.'
  gridInfo.appendChild(gridInfoText)
  gridSection.appendChild(gridInfo)

  container.appendChild(gridSection)

  // ══════════════════════════════════════════════════════════
  // BLOCK SECTION
  // ══════════════════════════════════════════════════════════

  blockSection = document.createElement('div')
  blockSection.className = 'flow-layout-section'
  blockSection.style.display = 'none'

  const blockPlaceholder = document.createElement('div')
  blockPlaceholder.className = 'flow-layout-placeholder'
  blockPlaceholder.textContent = 'Block elements stack vertically and take full width.'
  blockSection.appendChild(blockPlaceholder)

  container.appendChild(blockSection)

  // ══════════════════════════════════════════════════════════
  // NONE SECTION
  // ══════════════════════════════════════════════════════════

  noneSection = document.createElement('div')
  noneSection.className = 'flow-layout-section'
  noneSection.style.display = 'none'

  const nonePlaceholder = document.createElement('div')
  nonePlaceholder.className = 'flow-layout-placeholder'
  nonePlaceholder.textContent = 'Element is hidden from layout.'
  noneSection.appendChild(nonePlaceholder)

  container.appendChild(noneSection)

  // ══════════════════════════════════════════════════════════
  // SPACING SECTION (margin/padding)
  // ══════════════════════════════════════════════════════════

  const spacingSection = document.createElement('div')
  spacingSection.className = 'flow-layout-spacing'

  // Spacing header: Padding/Margin tabs + unit dropdown
  const spacingHeader = document.createElement('div')
  spacingHeader.className = 'flow-layout-spacing-header'

  const spacingTabs = document.createElement('div')
  spacingTabs.className = 'flow-layout-spacing-tabs'

  const paddingTab = document.createElement('div')
  paddingTab.className = 'flow-layout-spacing-tab active'
  paddingTab.textContent = 'Padding'
  paddingTab.addEventListener('click', (e) => {
    e.stopPropagation()
    activeSpacingType = 'padding'
    paddingTab.classList.add('active')
    marginTab.classList.remove('active')
    if (target) spacingUnit = detectSpacingUnit(target, 'padding')
    spacingUnitSelect.value = spacingUnit
    readSpacingFromElement()
  })
  spacingTabs.appendChild(paddingTab)

  const marginTab = document.createElement('div')
  marginTab.className = 'flow-layout-spacing-tab'
  marginTab.textContent = 'Margin'
  marginTab.addEventListener('click', (e) => {
    e.stopPropagation()
    activeSpacingType = 'margin'
    marginTab.classList.add('active')
    paddingTab.classList.remove('active')
    if (target) spacingUnit = detectSpacingUnit(target, 'margin')
    spacingUnitSelect.value = spacingUnit
    readSpacingFromElement()
  })
  spacingTabs.appendChild(marginTab)

  spacingHeader.appendChild(spacingTabs)

  // Unit dropdown
  spacingUnitSelect = document.createElement('select')
  spacingUnitSelect.className = 'flow-layout-unit-select'
  for (const u of SPACING_UNITS) {
    const opt = document.createElement('option')
    opt.value = u
    opt.textContent = u.toUpperCase()
    spacingUnitSelect.appendChild(opt)
  }
  spacingUnitSelect.value = 'tw'
  spacingUnitSelect.addEventListener('change', () => {
    spacingUnit = spacingUnitSelect.value as SpacingUnit
    readSpacingFromElement()
  })
  spacingUnitSelect.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  spacingHeader.appendChild(spacingUnitSelect)

  spacingSection.appendChild(spacingHeader)

  // Spacing controls wrapper (inputs + expand button side-by-side)
  const spacingControls = document.createElement('div')
  spacingControls.className = 'flow-layout-spacing-controls'

  const spacingInner = document.createElement('div')
  spacingInner.className = 'flow-layout-spacing-inner'

  // H/V input row (default mode)
  const spacingHVRow = document.createElement('div')
  spacingHVRow.className = 'flow-layout-spacing-row'

  // Horizontal input (left + right)
  const hInput = createSpacingInput('H')
  spacingHVRow.appendChild(hInput.wrapper)

  // Vertical input (top + bottom)
  const vInput = createSpacingInput('V')
  spacingHVRow.appendChild(vInput.wrapper)

  spacingInner.appendChild(spacingHVRow)

  // 4-side grid (expanded mode)
  const spacingGrid = document.createElement('div')
  spacingGrid.className = 'flow-layout-spacing-grid'
  spacingGrid.style.display = 'none'

  const topInput = createSpacingInput('T')
  const rightInput = createSpacingInput('R')
  const bottomInput = createSpacingInput('B')
  const leftInput = createSpacingInput('L')

  // Row 1: Top (centered)
  const gridTopRow = document.createElement('div')
  gridTopRow.className = 'flow-layout-spacing-grid-row'
  gridTopRow.appendChild(topInput.wrapper)
  spacingGrid.appendChild(gridTopRow)

  // Row 2: Left + Right
  const gridMiddleRow = document.createElement('div')
  gridMiddleRow.className = 'flow-layout-spacing-grid-middle'
  gridMiddleRow.appendChild(leftInput.wrapper)
  gridMiddleRow.appendChild(rightInput.wrapper)
  spacingGrid.appendChild(gridMiddleRow)

  // Row 3: Bottom (centered)
  const gridBottomRow = document.createElement('div')
  gridBottomRow.className = 'flow-layout-spacing-grid-row'
  gridBottomRow.appendChild(bottomInput.wrapper)
  spacingGrid.appendChild(gridBottomRow)

  spacingInner.appendChild(spacingGrid)
  spacingControls.appendChild(spacingInner)

  // Expand/collapse button (always visible, outside HV/grid)
  const expandBtn = document.createElement('div')
  expandBtn.className = 'flow-layout-spacing-expand-btn'
  expandBtn.title = 'Toggle 4-side mode'
  expandBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>'
  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    spacingExpanded = !spacingExpanded
    spacingHVRow.style.display = spacingExpanded ? 'none' : ''
    spacingGrid.style.display = spacingExpanded ? '' : 'none'
    expandBtn.classList.toggle('active', spacingExpanded)
    readSpacingFromElement()
  })
  spacingControls.appendChild(expandBtn)

  spacingSection.appendChild(spacingControls)

  // Box-sizing toggle
  const boxSizingRow = document.createElement('div')
  boxSizingRow.className = 'flow-layout-box-sizing'

  const boxLabel = document.createElement('span')
  boxLabel.className = 'flow-layout-box-label'
  boxLabel.textContent = 'Box size'
  boxSizingRow.appendChild(boxLabel)

  const boxToggle = document.createElement('div')
  boxToggle.className = 'flow-layout-box-toggle'

  const boxContentBtn = document.createElement('div')
  boxContentBtn.className = 'flow-layout-box-btn'
  boxContentBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="12" height="12" rx="0.5" fill="currentColor" opacity="0.3"/></svg>'
  boxContentBtn.title = 'Content Box \u2014 padding adds to dimensions'
  boxContentBtn.addEventListener('click', () => setBoxSizing('content-box'))
  boxToggle.appendChild(boxContentBtn)

  const boxBorderBtn = document.createElement('div')
  boxBorderBtn.className = 'flow-layout-box-btn'
  boxBorderBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>'
  boxBorderBtn.title = 'Border Box \u2014 padding included in dimensions'
  boxBorderBtn.addEventListener('click', () => setBoxSizing('border-box'))
  boxToggle.appendChild(boxBorderBtn)

  boxSizingRow.appendChild(boxToggle)
  spacingSection.appendChild(boxSizingRow)

  container.appendChild(spacingSection)

  // ── Spacing helpers ──

  function createSpacingInput(label: string) {
    const wrapper = document.createElement('div')
    wrapper.className = 'flow-layout-spacing-input'

    const lbl = document.createElement('span')
    lbl.className = 'flow-layout-spacing-icon'
    lbl.textContent = label
    lbl.style.cursor = 'ew-resize'
    wrapper.appendChild(lbl)

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'flow-layout-spacing-field'
    input.value = '0'

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
      if (e.key === 'Escape') input.blur()
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        const dir: 1 | -1 = e.key === 'ArrowUp' ? 1 : -1
        const newDisplay = stepSpacingDisplay(input.value, dir, e.shiftKey, spacingUnit)
        input.value = newDisplay
        commitSpacingDisplay(label, newDisplay)
        return
      }
      if (e.key.startsWith('Arrow')) e.stopPropagation()
    })

    input.addEventListener('blur', () => {
      // Auto-resolve: if user typed a value with a unit suffix (e.g. "1.5rem")
      const parsed = parseValueWithUnit(input.value)
      if (parsed.unit && parsed.unit !== spacingUnit && (SPACING_UNITS as readonly string[]).includes(parsed.unit)) {
        spacingUnit = parsed.unit as SpacingUnit
        spacingUnitSelect.value = spacingUnit
        input.value = formatUnitNum(Math.max(0, parseFloat(parsed.value) || 0), spacingUnit)
        commitSpacingDisplay(label, input.value)
        readSpacingFromElement()
        return
      }
      // Normal commit in current unit
      if (spacingUnit === 'tw') {
        const match = TAILWIND_SPACING.find(s => s.label === input.value.trim())
        const px = match ? match.px : (parseFloat(input.value) || 0)
        input.value = pxToDisplayValue(Math.max(0, px))
      } else {
        input.value = formatUnitNum(Math.max(0, parseFloat(input.value) || 0), spacingUnit)
      }
      commitSpacingDisplay(label, input.value)
    })

    input.addEventListener('focus', () => input.select())

    wrapper.appendChild(input)

    // Attach scrub to label — getValue/setValue work in px space
    attachScrub({
      labelEl: lbl,
      getValue: () => {
        if (!target) return 0
        const computed = getComputedStyle(target)
        const type = activeSpacingType
        if (spacingExpanded) {
          const edgeMap: Record<string, string> = { T: 'top', R: 'right', B: 'bottom', L: 'left' }
          return parseFloat(computed.getPropertyValue(`${type}-${edgeMap[label]}`)) || 0
        }
        if (label === 'H') return parseFloat(computed.getPropertyValue(`${type}-left`)) || 0
        if (label === 'V') return parseFloat(computed.getPropertyValue(`${type}-top`)) || 0
        return 0
      },
      setValue: (px) => {
        if (!target) return
        input.value = readPxFormatted(px, spacingUnit, target)
        commitSpacingFromPx(label, px)
      },
      min: 0,
      max: 200,
      step: 1,
      stepFn: (currentPx, dir) => {
        if (!target) return currentPx
        if (spacingUnit === 'tw') return stepTailwind(currentPx, dir, false)
        const unitVal = pxToUnitValue(currentPx, spacingUnit, target)
        const steps = UNIT_STEPS[spacingUnit] || UNIT_STEPS.px
        const newUnitVal = Math.max(0, unitVal + dir * steps.normal)
        return unitValueToPx(newUnitVal, spacingUnit, target)
      },
    })

    return { wrapper, input, label: lbl }
  }

  // Commit a CSS value to edges based on label (H/V or T/R/B/L)
  function commitSpacingEdge(label: string, cssVal: string) {
    if (!target) return
    const type = activeSpacingType
    if (spacingExpanded) {
      const edgeMap: Record<string, Edge> = { T: 'top', R: 'right', B: 'bottom', L: 'left' }
      const edge = edgeMap[label]
      if (edge) engine.applyStyle(target, { [`${type}-${edge}`]: cssVal })
    } else {
      if (label === 'H') {
        engine.applyStyle(target, { [`${type}-left`]: cssVal, [`${type}-right`]: cssVal })
      } else if (label === 'V') {
        engine.applyStyle(target, { [`${type}-top`]: cssVal, [`${type}-bottom`]: cssVal })
      }
    }
    onUpdate?.()
  }

  // Commit from display value (input text) in current spacing unit
  function commitSpacingDisplay(label: string, displayValue: string) {
    commitSpacingEdge(label, displayToCss(displayValue, spacingUnit))
  }

  // Commit from px value (scrub/drag) in current spacing unit
  function commitSpacingFromPx(label: string, px: number) {
    if (!target) return
    commitSpacingEdge(label, pxToCssInUnit(px, spacingUnit, target))
  }

  function readSpacingFromElement() {
    if (!target) return
    const computed = getComputedStyle(target)
    const type = activeSpacingType

    const topPx = parseFloat(computed.getPropertyValue(`${type}-top`)) || 0
    const rightPx = parseFloat(computed.getPropertyValue(`${type}-right`)) || 0
    const bottomPx = parseFloat(computed.getPropertyValue(`${type}-bottom`)) || 0
    const leftPx = parseFloat(computed.getPropertyValue(`${type}-left`)) || 0

    if (spacingExpanded) {
      topInput.input.value = readPxFormatted(topPx, spacingUnit, target)
      rightInput.input.value = readPxFormatted(rightPx, spacingUnit, target)
      bottomInput.input.value = readPxFormatted(bottomPx, spacingUnit, target)
      leftInput.input.value = readPxFormatted(leftPx, spacingUnit, target)
    } else {
      if (leftPx === rightPx) {
        hInput.input.value = readPxFormatted(leftPx, spacingUnit, target)
      } else {
        hInput.input.value = 'Mixed'
      }
      if (topPx === bottomPx) {
        vInput.input.value = readPxFormatted(topPx, spacingUnit, target)
      } else {
        vInput.input.value = 'Mixed'
      }
    }

    // Box sizing
    const boxSizingValue = computed.boxSizing || 'content-box'
    boxContentBtn.classList.toggle('active', boxSizingValue === 'content-box')
    boxBorderBtn.classList.toggle('active', boxSizingValue === 'border-box')
  }

  function setBoxSizing(value: 'content-box' | 'border-box') {
    if (!target) return
    engine.applyStyle(target, { 'box-sizing': value })
    boxContentBtn.classList.toggle('active', value === 'content-box')
    boxBorderBtn.classList.toggle('active', value === 'border-box')
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // SPINNER FACTORY
  // ══════════════════════════════════════════════════════════

  function createSpinner(initial: number, onChange: (val: number) => void) {
    const el = document.createElement('div')
    el.className = 'flow-layout-grid-spinner'

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'flow-layout-grid-spinner-input'
    input.value = String(initial)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
      if (e.key === 'Escape') input.blur()
      if (e.key.startsWith('Arrow')) e.stopPropagation()
    })
    input.addEventListener('blur', () => {
      const val = Math.max(1, Math.min(parseInt(input.value) || 1, 12))
      input.value = String(val)
      onChange(val)
    })
    input.addEventListener('focus', () => input.select())
    el.appendChild(input)

    const btns = document.createElement('div')
    btns.className = 'flow-layout-grid-spinner-btns'

    const up = document.createElement('div')
    up.className = 'flow-layout-grid-spinner-btn'
    up.textContent = '\u25b4'
    up.addEventListener('click', (e) => {
      e.stopPropagation()
      const val = Math.min((parseInt(input.value) || 1) + 1, 12)
      input.value = String(val)
      onChange(val)
    })
    btns.appendChild(up)

    const down = document.createElement('div')
    down.className = 'flow-layout-grid-spinner-btn'
    down.textContent = '\u25be'
    down.addEventListener('click', (e) => {
      e.stopPropagation()
      const val = Math.max((parseInt(input.value) || 1) - 1, 1)
      input.value = String(val)
      onChange(val)
    })
    btns.appendChild(down)

    el.appendChild(btns)
    return { el, input }
  }

  // ══════════════════════════════════════════════════════════
  // DISPLAY TYPE
  // ══════════════════════════════════════════════════════════

  function setDisplayType(type: DisplayType, isInline: boolean) {
    if (!target) return
    currentDisplay = type
    currentInline = isInline

    // Update tab highlighting
    for (const [t, btn] of Object.entries(tabBtns)) {
      btn.classList.toggle('active', t === type && !isInline)
    }

    // Update overflow trigger
    overflowTrigger.classList.toggle('active', isInline)

    // Update overflow menu items
    overflowMenuEl.querySelectorAll('.flow-layout-overflow-item').forEach((item) => {
      const el = item as HTMLElement
      el.classList.remove('active')
    })

    // Show/hide sections
    flexSection.style.display = type === 'flex' ? '' : 'none'
    gridSection.style.display = type === 'grid' ? '' : 'none'
    blockSection.style.display = type === 'block' ? '' : 'none'
    noneSection.style.display = type === 'none' ? '' : 'none'

    // Apply display to element
    let displayValue: string
    if (isInline) {
      if (type === 'flex') displayValue = 'inline-flex'
      else if (type === 'grid') displayValue = 'inline-grid'
      else if (type === 'block') displayValue = 'inline-block'
      else displayValue = 'none'
    } else {
      displayValue = type
    }

    engine.applyStyle(target, { display: displayValue })

    // If switching to flex, ensure direction/wrap/justify/align are set
    if (type === 'flex') {
      readFlexState(target)
      updateAlignPreview()
    }

    // If switching to grid, ensure grid template is set
    if (type === 'grid') {
      readGridState(target)
    }

    onUpdate?.()
  }

  function applyInlineDisplay(display: string) {
    if (!target) return
    const resolved = resolveDisplayType(display)
    const isInl = isInlineDisplay(display)
    currentDisplay = resolved
    currentInline = isInl

    // Highlight the right tab
    for (const [t, btn] of Object.entries(tabBtns)) {
      btn.classList.toggle('active', false)
    }
    overflowTrigger.classList.toggle('active', true)

    // Highlight the right overflow item
    overflowMenuEl.querySelectorAll('.flow-layout-overflow-item').forEach((item) => {
      const el = item as HTMLElement
      el.classList.toggle('active', el.dataset.display === display)
    })

    // Show/hide sections
    flexSection.style.display = resolved === 'flex' ? '' : 'none'
    gridSection.style.display = resolved === 'grid' ? '' : 'none'
    blockSection.style.display = resolved === 'block' ? '' : 'none'
    noneSection.style.display = resolved === 'none' ? '' : 'none'

    engine.applyStyle(target, { display })

    if (resolved === 'flex') {
      readFlexState(target)
      updateAlignPreview()
    }
    if (resolved === 'grid') {
      readGridState(target)
    }

    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // FLEX CONTROLS
  // ══════════════════════════════════════════════════════════

  function setDirection(dir: FlexDirection) {
    if (!target) return
    currentDirection = dir
    for (const [d, btn] of Object.entries(dirBtns)) {
      btn.classList.toggle('active', d === dir)
    }
    engine.applyStyle(target, { 'flex-direction': dir })
    rebuildDropdowns()
    updateAlignPreview()
    onUpdate?.()
  }

  function setWrap(wrap: FlexWrap) {
    if (!target) return
    currentWrap = wrap
    wrapTriggerText.textContent = wrap === 'nowrap' ? 'No wrap' : wrap.charAt(0).toUpperCase() + wrap.slice(1)
    wrapMenuEl.querySelectorAll('.flow-layout-wrap-item').forEach((item) => {
      (item as HTMLElement).classList.toggle('active', (item as HTMLElement).dataset.wrap === wrap)
    })
    engine.applyStyle(target, { 'flex-wrap': wrap })
    onUpdate?.()
  }

  function setJustify(value: string) {
    if (!target) return
    currentJustify = value
    engine.applyStyle(target, { 'justify-content': value })
    rebuildDropdowns()
    updateAlignPreview()
    onUpdate?.()
  }

  function setAlignItems(value: string) {
    if (!target) return
    currentAlign = value
    engine.applyStyle(target, { 'align-items': value })
    rebuildDropdowns()
    updateAlignPreview()
    onUpdate?.()
  }

  function commitGap() {
    if (!target) return
    engine.applyStyle(target, { gap: `${currentGap}${currentGapUnit}` })
    onUpdate?.()
  }

  function commitGrid() {
    if (!target) return
    engine.applyStyle(target, {
      'grid-template-columns': `repeat(${currentGridCols}, 1fr)`,
      'grid-template-rows': `repeat(${currentGridRows}, 1fr)`,
    })
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // ALIGNMENT PREVIEW (3 animated bars)
  // ══════════════════════════════════════════════════════════

  function isRowDirection(): boolean {
    return currentDirection === 'row' || currentDirection === 'row-reverse'
  }

  function rebuildDropdowns() {
    const isRow = isRowDirection()
    const xOpts = isRow ? JUSTIFY_OPTIONS : ALIGN_OPTIONS
    const yOpts = isRow ? ALIGN_OPTIONS : JUSTIFY_OPTIONS

    justifySelect.innerHTML = ''
    for (const o of xOpts) {
      const el = document.createElement('option')
      el.value = o.value
      el.textContent = o.label
      justifySelect.appendChild(el)
    }
    justifySelect.value = isRow ? currentJustify : currentAlign

    alignSelect.innerHTML = ''
    for (const o of yOpts) {
      const el = document.createElement('option')
      el.value = o.value
      el.textContent = o.label
      alignSelect.appendChild(el)
    }
    alignSelect.value = isRow ? currentAlign : currentJustify
  }

  function setXValue(value: string) {
    if (!target) return
    if (isRowDirection()) {
      currentJustify = value
      engine.applyStyle(target, { 'justify-content': value })
    } else {
      currentAlign = value
      engine.applyStyle(target, { 'align-items': value })
    }
    updateAlignPreview()
    onUpdate?.()
  }

  function setYValue(value: string) {
    if (!target) return
    if (isRowDirection()) {
      currentAlign = value
      engine.applyStyle(target, { 'align-items': value })
    } else {
      currentJustify = value
      engine.applyStyle(target, { 'justify-content': value })
    }
    updateAlignPreview()
    onUpdate?.()
  }

  function handleDotClick(col: number, row: number, e: MouseEvent) {
    if (!target) return
    const posMap = ['flex-start', 'center', 'flex-end']
    const isRow = isRowDirection()
    const meta = e.metaKey || e.ctrlKey

    let newJustify: string
    let newAlign: string

    if (isRow) {
      newJustify = meta ? 'space-between' : posMap[col]
      newAlign = e.altKey ? 'stretch' : posMap[row]
    } else {
      newJustify = meta ? 'space-between' : posMap[row]
      newAlign = e.altKey ? 'stretch' : posMap[col]
    }

    currentJustify = newJustify
    currentAlign = newAlign
    engine.applyStyle(target, {
      'justify-content': newJustify,
      'align-items': newAlign,
    })
    rebuildDropdowns()
    updateAlignPreview()
    onUpdate?.()
  }

  function updateAlignPreview() {
    const isRow = isRowDirection()
    const barThick = 3
    const barLengths = [18, 24, 14]
    const isStretch = currentAlign === 'stretch'
    const rangeStart = DOT_POSITIONS[0]
    const rangeEnd = DOT_POSITIONS[2]

    const mainPos = distributeOnAxis(barThick, currentJustify)
    const crossPos = alignOnCross(barThick, currentAlign)

    for (let i = 0; i < 3; i++) {
      const bar = alignBars[i]
      if (isRow) {
        bar.style.left = `${mainPos[i]}px`
        bar.style.width = `${barThick}px`
        if (isStretch) {
          bar.style.top = `${rangeStart}px`
          bar.style.height = `${rangeEnd - rangeStart}px`
        } else {
          bar.style.top = `${crossPos}px`
          bar.style.height = `${barLengths[i]}px`
        }
      } else {
        bar.style.top = `${mainPos[i]}px`
        bar.style.height = `${barThick}px`
        if (isStretch) {
          bar.style.left = `${rangeStart}px`
          bar.style.width = `${rangeEnd - rangeStart}px`
        } else {
          bar.style.left = `${crossPos}px`
          bar.style.width = `${barLengths[i]}px`
        }
      }
    }
    updateDotHighlights()
  }

  function distributeOnAxis(size: number, justify: string): number[] {
    const start = DOT_POSITIONS[0]
    const end = DOT_POSITIONS[2]
    const range = end - start
    const count = 3
    const total = size * count
    const remaining = range - total
    const gap = 2

    switch (justify) {
      case 'flex-start': {
        let pos = start
        return Array.from({ length: count }, () => { const p = pos; pos += size + gap; return p })
      }
      case 'flex-end': {
        let pos = end
        const r: number[] = []
        for (let i = 0; i < count; i++) { pos -= size; r.unshift(pos); pos -= gap }
        return r
      }
      case 'center': {
        const totalWithGaps = total + (count - 1) * gap
        let pos = start + (range - totalWithGaps) / 2
        return Array.from({ length: count }, () => { const p = pos; pos += size + gap; return p })
      }
      case 'space-between': {
        return DOT_POSITIONS.map((d) => d - size / 2)
      }
      case 'space-around': {
        const space = remaining / count
        let pos = start + space / 2
        return Array.from({ length: count }, () => { const p = pos; pos += size + space; return p })
      }
      case 'space-evenly': {
        const space = remaining / (count + 1)
        let pos = start + space
        return Array.from({ length: count }, () => { const p = pos; pos += size + space; return p })
      }
      default: {
        let pos = start
        return Array.from({ length: count }, () => { const p = pos; pos += size + gap; return p })
      }
    }
  }

  function alignOnCross(barThick: number, align: string): number {
    const start = DOT_POSITIONS[0]
    const mid = DOT_POSITIONS[1]
    const end = DOT_POSITIONS[2]
    switch (align) {
      case 'flex-start': return start
      case 'flex-end': return end - barThick
      case 'center': return mid - barThick / 2
      case 'baseline': return start + (end - start) * 0.25
      case 'stretch': return start
      default: return mid - barThick / 2
    }
  }

  function updateDotHighlights() {
    const isRow = isRowDirection()
    const posMap = ['flex-start', 'center', 'flex-end']
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dot = alignDots[row * 3 + col]
        if (!dot) continue
        let active = false
        if (isRow) {
          active = posMap.indexOf(currentJustify) === col && posMap.indexOf(currentAlign) === row
        } else {
          active = posMap.indexOf(currentAlign) === col && posMap.indexOf(currentJustify) === row
        }
        dot.classList.toggle('active', active)
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // DROPDOWNS
  // ══════════════════════════════════════════════════════════

  function toggleWrapDropdown() {
    if (wrapDropdownOpen) {
      closeWrapDropdown()
    } else {
      wrapDropdownOpen = true
      wrapMenuEl.classList.add('open')
    }
  }

  function closeWrapDropdown() {
    wrapDropdownOpen = false
    wrapMenuEl.classList.remove('open')
  }

  function toggleOverflowDropdown() {
    if (overflowDropdownOpen) {
      closeOverflowDropdown()
    } else {
      overflowDropdownOpen = true
      overflowMenuEl.classList.add('open')
    }
  }

  function closeOverflowDropdown() {
    overflowDropdownOpen = false
    overflowMenuEl.classList.remove('open')
  }

  function onDocumentClick() {
    if (wrapDropdownOpen) closeWrapDropdown()
    if (overflowDropdownOpen) closeOverflowDropdown()
  }

  // ══════════════════════════════════════════════════════════
  // READ STATE FROM ELEMENT
  // ══════════════════════════════════════════════════════════

  function readFromElement(el: HTMLElement) {
    const computed = getComputedStyle(el)
    const display = computed.display

    // Determine display type
    currentDisplay = resolveDisplayType(display)
    currentInline = isInlineDisplay(display)

    // Update tabs
    for (const [t, btn] of Object.entries(tabBtns)) {
      btn.classList.toggle('active', t === currentDisplay && !currentInline)
    }
    overflowTrigger.classList.toggle('active', currentInline)

    // Update overflow menu items
    overflowMenuEl.querySelectorAll('.flow-layout-overflow-item').forEach((item) => {
      const itemEl = item as HTMLElement
      itemEl.classList.toggle('active', currentInline && itemEl.dataset.display === display)
    })

    // Show/hide sections
    flexSection.style.display = currentDisplay === 'flex' ? '' : 'none'
    gridSection.style.display = currentDisplay === 'grid' ? '' : 'none'
    blockSection.style.display = currentDisplay === 'block' ? '' : 'none'
    noneSection.style.display = currentDisplay === 'none' ? '' : 'none'

    if (currentDisplay === 'flex') {
      readFlexState(el)
      updateAlignPreview()
    }

    if (currentDisplay === 'grid') {
      readGridState(el)
    }

    // Always read spacing (margin/padding applies to all display types)
    readSpacingFromElement()
  }

  function readFlexState(el: HTMLElement) {
    const computed = getComputedStyle(el)

    currentDirection = (computed.flexDirection || 'row') as FlexDirection
    for (const [d, btn] of Object.entries(dirBtns)) {
      btn.classList.toggle('active', d === currentDirection)
    }

    currentWrap = (computed.flexWrap || 'nowrap') as FlexWrap
    wrapTriggerText.textContent = currentWrap === 'nowrap' ? 'No wrap' : currentWrap.charAt(0).toUpperCase() + currentWrap.slice(1)

    currentJustify = computed.justifyContent || 'flex-start'
    if (currentJustify === 'normal') currentJustify = 'flex-start'

    currentAlign = computed.alignItems || 'stretch'
    if (currentAlign === 'normal') currentAlign = 'stretch'

    rebuildDropdowns()

    const gapVal = parseInt(computed.gap) || 0
    currentGap = gapVal
    gapSlider.value = String(Math.min(gapVal, 100))
    gapInput.value = String(gapVal)
  }

  function readGridState(el: HTMLElement) {
    const computed = getComputedStyle(el)

    // Parse grid-template-columns to get count
    const cols = computed.gridTemplateColumns
    if (cols && cols !== 'none') {
      const colCount = cols.split(/\s+/).filter(Boolean).length
      currentGridCols = colCount || 2
      gridColsInput.value = String(currentGridCols)
    }

    const rows = computed.gridTemplateRows
    if (rows && rows !== 'none') {
      const rowCount = rows.split(/\s+/).filter(Boolean).length
      currentGridRows = rowCount || 2
      gridRowsInput.value = String(currentGridRows)
    }

    const gapVal = parseInt(computed.gap) || 0
    const gridGapSliderEl = gridSection.querySelector('.flow-layout-gap-slider') as HTMLInputElement
    const gridGapInputEl = gridSection.querySelector('.flow-layout-gap-input') as HTMLInputElement
    if (gridGapSliderEl) gridGapSliderEl.value = String(Math.min(gapVal, 100))
    if (gridGapInputEl) gridGapInputEl.value = String(gapVal)
  }

  // ══════════════════════════════════════════════════════════
  // KEYBOARD
  // ══════════════════════════════════════════════════════════

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    if (currentDisplay !== 'flex') return
    if (shouldIgnoreKeyboardShortcut(e)) return

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    if (!isArrow) return

    e.preventDefault()
    e.stopPropagation()

    const isRow = isRowDirection()
    const meta = e.metaKey || e.ctrlKey

    if (meta) {
      // Cmd+Right → row, Cmd+Down → column
      if (e.key === 'ArrowRight') setDirection('row')
      else if (e.key === 'ArrowDown') setDirection('column')
      // Cmd+Left → toggle wrap on/off, Cmd+Up → toggle wrap-reverse
      else if (e.key === 'ArrowLeft') setWrap(currentWrap === 'nowrap' ? 'wrap' : 'nowrap')
      else if (e.key === 'ArrowUp') setWrap(currentWrap === 'wrap-reverse' ? 'nowrap' : 'wrap-reverse')
      return
    }

    if (e.shiftKey) {
      // Shift+arrow: direction-aware distribute/stretch cycling
      // Main axis → cycle distribute (space-between → around → evenly)
      // Cross axis → cycle stretch ↔ baseline
      const isHorizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
      const isMainAxis = isRow ? isHorizontal : !isHorizontal

      if (isMainAxis) {
        const distributeValues = ['space-between', 'space-around', 'space-evenly']
        const idx = distributeValues.indexOf(currentJustify)
        const next = distributeValues[(idx + 1) % distributeValues.length]
        setJustify(next)
      } else {
        const crossSpecial = ['stretch', 'baseline']
        const idx = crossSpecial.indexOf(currentAlign)
        const next = crossSpecial[(idx + 1) % crossSpecial.length]
        setAlignItems(next)
      }
      return
    }

    // Plain arrows: navigate the 3x3 positional grid (direction-aware)
    // Row mode: ←→ = justify (main), ↑↓ = align (cross)
    // Col mode: ↑↓ = justify (main), ←→ = align (cross)
    const positional = ['flex-start', 'center', 'flex-end']
    const isHorizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
    const isForward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const isMainAxis = isRow ? isHorizontal : !isHorizontal

    if (isMainAxis) {
      const idx = positional.indexOf(currentJustify)
      if (idx === -1) { setJustify('flex-start'); return }
      const next = isForward
        ? positional[Math.min(idx + 1, 2)]
        : positional[Math.max(idx - 1, 0)]
      setJustify(next)
    } else {
      const idx = positional.indexOf(currentAlign)
      if (idx === -1) { setAlignItems('flex-start'); return }
      const next = isForward
        ? positional[Math.min(idx + 1, 2)]
        : positional[Math.max(idx - 1, 0)]
      setAlignItems(next)
    }
  }

  // ══════════════════════════════════════════════════════════
  // OVERLAY HANDLES (on-element drag visualization)
  // ══════════════════════════════════════════════════════════

  const overlay = document.createElement('div')
  overlay.className = 'flow-layout-overlay'
  overlay.style.display = 'none'
  shadowRoot.appendChild(overlay)

  const handles = new Map<Edge, HTMLDivElement>()
  for (const edge of EDGES) {
    const handle = document.createElement('div')
    handle.className = 'flow-layout-handle'
    handle.dataset.edge = edge
    handle.dataset.type = 'padding' // default
    const isVertical = edge === 'top' || edge === 'bottom'
    handle.style.cursor = isVertical ? 'ns-resize' : 'ew-resize'
    setupDragHandler(handle, edge)
    handles.set(edge, handle)
    overlay.appendChild(handle)
  }

  // Value label (shown on hover/drag)
  const valueLabel = document.createElement('div')
  valueLabel.className = 'flow-layout-value-label'
  overlay.appendChild(valueLabel)

  // Alt key toggles handle type (padding ↔ margin)
  let handleType: SpacingType = 'padding'

  function onAltKeyDown(e: KeyboardEvent) {
    if (e.key === 'Alt') {
      handleType = 'margin'
      for (const h of handles.values()) h.dataset.type = 'margin'
    }
  }

  function onAltKeyUp(e: KeyboardEvent) {
    if (e.key === 'Alt') {
      handleType = 'padding'
      for (const h of handles.values()) h.dataset.type = 'padding'
    }
  }

  // ── Drag handler ──

  function setupDragHandler(handle: HTMLDivElement, edge: Edge) {
    const DRAG_THRESHOLD = 3

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || !target) return

      const startX = e.clientX
      const startY = e.clientY
      const type = handleType
      const computed = getComputedStyle(target)
      const isVertical = edge === 'top' || edge === 'bottom'
      const startValue = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
      const allStartValues: Record<Edge, number> = { top: 0, right: 0, bottom: 0, left: 0 }
      for (const side of EDGES) {
        allStartValues[side] = parseFloat(computed.getPropertyValue(`${type}-${side}`)) || 0
      }
      // Capture the unit at drag start so it doesn't change mid-drag
      const dragUnit = spacingUnit

      let isDragging = false
      let dragMode: 'single' | 'all' | 'opposing' = 'single'

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX
        const dy = me.clientY - startY

        if (!isDragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
          isDragging = true
          document.body.style.userSelect = 'none'
          handle.classList.add('dragging')
          engine.beginBatch()
        }

        if (!target) return

        let delta = isVertical ? dy : dx
        if (edge === 'top' || edge === 'left') delta = -delta

        if (me.shiftKey) {
          dragMode = 'all'
          for (const side of EDGES) {
            const newPx = Math.max(0, allStartValues[side] + delta)
            target.style.setProperty(`${type}-${side}`, pxToCssInUnit(newPx, dragUnit, target))
          }
        } else if (me.altKey) {
          dragMode = 'opposing'
          const opposite = OPPOSING[edge]
          const newPx = Math.max(0, startValue + delta)
          const oppPx = Math.max(0, allStartValues[opposite] + delta)
          target.style.setProperty(`${type}-${edge}`, pxToCssInUnit(newPx, dragUnit, target))
          target.style.setProperty(`${type}-${opposite}`, pxToCssInUnit(oppPx, dragUnit, target))
        } else {
          dragMode = 'single'
          const newPx = Math.max(0, startValue + delta)
          target.style.setProperty(`${type}-${edge}`, pxToCssInUnit(newPx, dragUnit, target))
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

      const finalizeDrag = () => {
        if (!target) {
          engine.cancelBatch()
          return
        }

        const changes: Record<string, string> = {}

        if (dragMode === 'all') {
          for (const side of EDGES) {
            const prop = `${type}-${side}`
            const finalVal = target.style.getPropertyValue(prop)
            target.style.setProperty(prop, pxToCssInUnit(allStartValues[side], dragUnit, target))
            changes[prop] = finalVal
          }
        } else if (dragMode === 'opposing') {
          const opposite = OPPOSING[edge]
          for (const side of [edge, opposite]) {
            const prop = `${type}-${side}`
            const finalVal = target.style.getPropertyValue(prop)
            target.style.setProperty(prop, pxToCssInUnit(allStartValues[side], dragUnit, target))
            changes[prop] = finalVal
          }
        } else {
          const prop = `${type}-${edge}`
          const finalVal = target.style.getPropertyValue(prop)
          target.style.setProperty(prop, pxToCssInUnit(startValue, dragUnit, target))
          changes[prop] = finalVal
        }

        engine.applyStyle(target, changes)
        engine.commitBatch()
        readFromElement(target)
        positionHandles()
        onUpdate?.()
      }

      const onUp = (me: MouseEvent) => {
        cleanup()

        if (!isDragging) {
          // Click-through: re-dispatch to underlying element
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

        finalizeDrag()
      }

      const onBlur = () => {
        cleanup()
        if (isDragging) finalizeDrag()
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      window.addEventListener('blur', onBlur, { once: true })
    })
  }

  // ── Handle positioning ──

  function positionHandles() {
    if (!target) return

    const rect = target.getBoundingClientRect()
    const computed = getComputedStyle(target)
    const type = handleType

    for (const edge of EDGES) {
      const handle = handles.get(edge)!
      const value = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0

      if (type === 'margin') {
        positionMarginHandle(handle, rect, edge, value)
      } else {
        positionPaddingHandle(handle, rect, edge, value)
      }
    }
  }

  function positionMarginHandle(handle: HTMLDivElement, rect: DOMRect, edge: Edge, value: number) {
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

  function positionPaddingHandle(handle: HTMLDivElement, rect: DOMRect, edge: Edge, value: number) {
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
    const raw = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0
    const display = readPxFormatted(raw, spacingUnit, target)
    const unitSuffix = spacingUnit === 'tw' ? '' : spacingUnit
    const rect = target.getBoundingClientRect()

    valueLabel.textContent = `${type}-${edge}: ${display}${unitSuffix}`
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
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    if (isDetached) return // user has manually positioned the panel
    const pos = computeToolPanelPosition(target, 260, container.offsetHeight || 400)
    container.style.left = `${pos.left}px`
    container.style.top = `${pos.top}px`
  }

  function clampToViewport() {
    const rect = container.getBoundingClientRect()
    const margin = 8
    let left = parseFloat(container.style.left) || 0
    let top = parseFloat(container.style.top) || 0
    if (left < margin) left = margin
    if (top < margin) top = margin
    if (left + rect.width > window.innerWidth - margin) left = window.innerWidth - rect.width - margin
    if (top + rect.height > window.innerHeight - margin) top = window.innerHeight - rect.height - margin
    container.style.left = `${left}px`
    container.style.top = `${top}px`
  }

  function onScrollOrResize() {
    if (!isDetached) positionNearElement()
    else clampToViewport()
    positionHandles()
  }

  // ══════════════════════════════════════════════════════════
  // GRAB BAR DRAG
  // ══════════════════════════════════════════════════════════

  function onGrabStart(e: MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    grabDragStartX = e.clientX
    grabDragStartY = e.clientY
    panelStartLeft = parseFloat(container.style.left) || 0
    panelStartTop = parseFloat(container.style.top) || 0
    grabBar.classList.add('dragging')
    document.addEventListener('mousemove', onGrabMove)
    document.addEventListener('mouseup', onGrabEnd)
  }

  function onGrabMove(e: MouseEvent) {
    const dx = e.clientX - grabDragStartX
    const dy = e.clientY - grabDragStartY

    // Activate detached mode after 3px of drag
    if (!isDetached && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      isDetached = true
      container.classList.add('detached')
    }

    container.style.left = `${panelStartLeft + dx}px`
    container.style.top = `${panelStartTop + dy}px`
    clampToViewport()
  }

  function onGrabEnd() {
    grabBar.classList.remove('dragging')
    document.removeEventListener('mousemove', onGrabMove)
    document.removeEventListener('mouseup', onGrabEnd)
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      closeWrapDropdown()
      closeOverflowDropdown()

      // Update grab bar element name
      elementNameEl.textContent = getElementLabel(element)

      // Auto-detect spacing unit
      spacingUnit = detectSpacingUnit(element, activeSpacingType)
      spacingUnitSelect.value = spacingUnit

      readFromElement(element)
      container.style.display = ''
      overlay.style.display = ''
      positionNearElement()
      positionHandles()
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keydown', onAltKeyDown)
      document.addEventListener('keyup', onAltKeyUp)
      document.addEventListener('click', onDocumentClick)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      closeWrapDropdown()
      closeOverflowDropdown()
      container.style.display = 'none'
      overlay.style.display = 'none'
      hideAllHandles()
      // Reset handle type so Alt state doesn't leak across sessions
      handleType = 'padding'
      for (const h of handles.values()) h.dataset.type = 'padding'
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keydown', onAltKeyDown)
      document.removeEventListener('keyup', onAltKeyUp)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      closeWrapDropdown()
      closeOverflowDropdown()
      toolHeader.destroy()
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keydown', onAltKeyDown)
      document.removeEventListener('keyup', onAltKeyUp)
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('mousemove', onGrabMove)
      document.removeEventListener('mouseup', onGrabEnd)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      overlay.remove()
      styleEl.remove()
    },
  }
}
