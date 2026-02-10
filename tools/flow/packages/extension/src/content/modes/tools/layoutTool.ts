/**
 * Layout Tool — Design Sub-Mode 3
 *
 * Webflow-style floating panel for display/layout manipulation:
 * - Display type tabs: Block, Flex, Grid, None (+ overflow for inline variants)
 * - Flex: direction buttons, wrap dropdown, alignment preview grid,
 *   justify-content/align-items dropdowns, gap slider with lock
 * - Grid: cols/rows spinners, direction, alignment, gap
 * - Block/None: info placeholders
 *
 * Keyboard shortcuts (flex mode only):
 * - ↑↓: cycle justify-content
 * - ←→: cycle align-items
 * - Cmd/Ctrl+↑↓: toggle flex-direction (row ↔ column)
 * - Cmd/Ctrl+←→: toggle flex-wrap (nowrap ↔ wrap)
 * - Shift+arrow: cycle align-self on the element itself
 *
 * Uses the unified mutation engine for undo/redo.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseValueWithUnit } from './unitInput'
import styles from './layoutTool.css?inline'

// ── Types ──

type DisplayType = 'block' | 'flex' | 'grid' | 'none'
type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

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

const PICKER_MARGIN = 8

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

const INLINE_DISPLAY_MAP: Record<string, string> = {
  'inline-block': 'block',
  'inline-flex': 'flex',
  'inline-grid': 'grid',
  inline: 'block',
}

const DISPLAY_TABS: DisplayType[] = ['block', 'flex', 'grid', 'none']

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

function cycleForward<T>(values: readonly T[], current: T): T {
  const idx = values.indexOf(current)
  return values[(idx + 1) % values.length]
}

function cycleBackward<T>(values: readonly T[], current: T): T {
  const idx = values.indexOf(current)
  return values[(idx - 1 + values.length) % values.length]
}

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

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-layout'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Panel Header ──

  const panelHeader = document.createElement('div')
  panelHeader.className = 'flow-layout-panel-header'

  const panelTitle = document.createElement('span')
  panelTitle.className = 'flow-layout-panel-title'
  panelTitle.textContent = 'Layout'
  panelHeader.appendChild(panelTitle)

  const panelChevron = document.createElement('span')
  panelChevron.className = 'flow-layout-panel-chevron'
  panelChevron.textContent = '\u2228'
  panelHeader.appendChild(panelChevron)

  container.appendChild(panelHeader)

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
    tab.textContent = type.charAt(0).toUpperCase() + type.slice(1)
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
    // Keyboard shortcuts only active in flex mode
    if (currentDisplay !== 'flex') return

    const isArrow =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    if (!isArrow) return

    // Don't intercept if any input/select/textarea is focused
    const active = shadowRoot.activeElement || document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return

    e.preventDefault()
    e.stopPropagation()

    const meta = e.metaKey || e.ctrlKey

    if (e.altKey) {
      // Alt+arrow: set flex-direction to match arrow direction
      const dirMap: Record<string, FlexDirection> = {
        ArrowRight: 'row',
        ArrowDown: 'column',
        ArrowLeft: 'row-reverse',
        ArrowUp: 'column-reverse',
      }
      const next = dirMap[e.key]
      if (next) setDirection(next)
    } else if (meta) {
      // Cmd/Ctrl + Up/Down: toggle flex-direction
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const next = currentDirection === 'column' ? 'row' : 'column'
        setDirection(next)
      }
      // Cmd/Ctrl + Left/Right: toggle flex-wrap
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const next = currentWrap === 'wrap' ? 'nowrap' : 'wrap'
        setWrap(next)
      }
    } else if (e.shiftKey) {
      // Shift+arrow: cycle align-self on the element itself
      const selfValue = getComputedStyle(target).alignSelf || 'auto'
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const next = cycleForward(ALIGN_VALUES, selfValue as typeof ALIGN_VALUES[number])
        engine.applyStyle(target, { 'align-self': next })
      } else {
        const next = cycleBackward(ALIGN_VALUES, selfValue as typeof ALIGN_VALUES[number])
        engine.applyStyle(target, { 'align-self': next })
      }
      onUpdate?.()
    } else {
      // Up/Down: cycle justify-content
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const next =
          e.key === 'ArrowUp'
            ? cycleForward(JUSTIFY_VALUES, currentJustify as typeof JUSTIFY_VALUES[number])
            : cycleBackward(JUSTIFY_VALUES, currentJustify as typeof JUSTIFY_VALUES[number])
        setJustify(next)
      }
      // Left/Right: cycle align-items
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const next =
          e.key === 'ArrowRight'
            ? cycleForward(ALIGN_VALUES, currentAlign as typeof ALIGN_VALUES[number])
            : cycleBackward(ALIGN_VALUES, currentAlign as typeof ALIGN_VALUES[number])
        setAlignItems(next)
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    const rect = target.getBoundingClientRect()
    const pickerW = 260
    const pickerH = container.offsetHeight || 400

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

  function onScrollOrResize() { positionNearElement() }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      closeWrapDropdown()
      closeOverflowDropdown()
      readFromElement(element)
      container.style.display = ''
      positionNearElement()
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('click', onDocumentClick)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      closeWrapDropdown()
      closeOverflowDropdown()
      container.style.display = 'none'
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      closeWrapDropdown()
      closeOverflowDropdown()
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      styleEl.remove()
    },
  }
}
