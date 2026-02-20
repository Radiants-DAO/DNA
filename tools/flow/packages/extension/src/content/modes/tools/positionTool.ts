/**
 * Position Tool — Design Sub-Mode 1
 *
 * Webflow-style floating panel for CSS position manipulation + DOM reordering.
 * - Position type dropdown (static, relative, absolute, fixed, sticky)
 * - Origin preset buttons (horizontal row, for absolute/fixed/sticky) + "full" preset
 * - Offset inputs (top, right, bottom, left) with per-input unit selects
 * - Relative-to label showing positioned ancestor
 * - Z-index input with decrement button
 * - Arrow keys for DOM reorder (merged from moveTool)
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { resolveInputWithUnit } from './unitInput'
import { createToolPanelHeader } from './toolPanelHeader'
import styles from './positionTool.css?inline'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'

// ── Types ──

type PositionType = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
type PositionOrigin = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br' | 'full'

interface DomSnapshot {
  element: HTMLElement
  parent: HTMLElement
  nextSibling: Node | null
}

export interface PositionToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface PositionTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Constants ──

import { computeToolPanelPosition } from './toolPanelPosition'

const PICKER_MARGIN = 8
const POSITION_TYPES: PositionType[] = ['static', 'relative', 'absolute', 'fixed', 'sticky']
const OFFSET_SIDES = ['top', 'right', 'bottom', 'left'] as const
const UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh', 'vmin', 'vmax'] as const

const POSITION_DESCRIPTIONS: Record<PositionType, string> = {
  static: 'Static is the default position and displays an element based on its position in the document flow.',
  relative: 'Relative positions an element relative to its normal position in the document flow.',
  absolute: 'Absolute positions an element relative to its nearest positioned ancestor.',
  fixed: 'Fixed positions an element relative to the browser viewport. It stays in place when scrolling.',
  sticky: 'Sticky toggles between relative and fixed positioning based on the scroll position.',
}

const ORIGIN_PRESETS: Record<PositionOrigin, Record<string, string>> = {
  tl: { top: '0px', left: '0px', bottom: 'auto', right: 'auto' },
  tc: { top: '0px', left: '50%', bottom: 'auto', right: 'auto' },
  tr: { top: '0px', right: '0px', bottom: 'auto', left: 'auto' },
  ml: { top: '50%', left: '0px', bottom: 'auto', right: 'auto' },
  mc: { top: '50%', left: '50%', bottom: 'auto', right: 'auto' },
  mr: { top: '50%', right: '0px', bottom: 'auto', left: 'auto' },
  bl: { bottom: '0px', left: '0px', top: 'auto', right: 'auto' },
  bc: { bottom: '0px', left: '50%', top: 'auto', right: 'auto' },
  br: { bottom: '0px', right: '0px', top: 'auto', left: 'auto' },
  full: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
}

const ORIGIN_GRID: PositionOrigin[][] = [
  ['tl', 'tc', 'tr'],
  ['ml', 'mc', 'mr'],
  ['bl', 'bc', 'br'],
]

// ── SVG Icons ──

const POSITION_ICONS: Record<PositionType, string> = {
  static: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  relative: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="12" height="12" rx="1"/><rect x="9" y="9" width="12" height="12" rx="1" stroke-dasharray="3 2"/></svg>',
  absolute: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="1" stroke-dasharray="3 2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',
  fixed: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="3" x2="12" y2="10"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="21" y2="12"/></svg>',
  sticky: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="13" width="10" height="5" rx="1"/></svg>',
}

const ORIGIN_ICONS: Record<PositionOrigin, string> = {
  tl: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="1.5" y="1.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  tc: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="6" y="1.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  tr: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="10.5" y="1.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  ml: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="1.5" y="4.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  mc: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="6" y="4.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  mr: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="10.5" y="4.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  bl: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="1.5" y="7.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  bc: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="6" y="7.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  br: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="10.5" y="7.5" width="4" height="3" rx="0.5" fill="currentColor"/></svg>',
  full: '<svg viewBox="0 0 16 12"><rect x="0.5" y="0.5" width="15" height="11" rx="1" stroke="currentColor" fill="none" stroke-opacity="0.4"/><rect x="1.5" y="1.5" width="13" height="9" rx="0.5" fill="currentColor" opacity="0.6"/></svg>',
}

const CROSSHAIR_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>'

// ── Helpers ──

function parseCssOffset(cssValue: string): { value: string; unit: string } {
  if (!cssValue || cssValue === 'auto' || cssValue === 'none') return { value: '', unit: 'px' }
  if (cssValue === '0px' || cssValue === '0') return { value: '0', unit: 'px' }
  const match = cssValue.match(/^(-?\d*\.?\d+)(px|%|rem|em|vw|vh|vmin|vmax)?$/i)
  if (match) return { value: match[1], unit: match[2] || 'px' }
  return { value: '', unit: 'px' }
}

function buildCssOffset(value: string, unit: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'auto') return 'auto'
  const match = trimmed.match(/^(-?\d*\.?\d+)$/)
  if (match) return `${match[1]}${unit}`
  return 'auto'
}

function getElementLabel(el: HTMLElement): string {
  if (el.id) return `#${el.id}`
  if (el.className && typeof el.className === 'string') {
    const first = el.className.trim().split(/\s+/)[0]
    if (first) return first
  }
  return el.tagName.toLowerCase()
}

function getRelativeToLabel(el: HTMLElement, posType: PositionType): string {
  if (posType === 'relative') return 'Itself'
  if (posType === 'fixed') return 'Viewport'

  if (posType === 'absolute') {
    let parent = el.parentElement
    while (parent && parent !== document.documentElement) {
      if (parent === document.body) break
      const pos = getComputedStyle(parent).position
      if (pos !== 'static') return getElementLabel(parent)
      parent = parent.parentElement
    }
    return 'body'
  }

  if (posType === 'sticky') {
    let parent = el.parentElement
    while (parent && parent !== document.documentElement) {
      if (parent === document.body) break
      const ov = getComputedStyle(parent).overflow
      if (ov !== 'visible' && ov !== '') return getElementLabel(parent)
      parent = parent.parentElement
    }
    return 'body'
  }

  return 'body'
}

// ── Tool Implementation ──

export function createPositionTool(options: PositionToolOptions): PositionTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null
  let currentPositionType: PositionType = 'static'
  let currentOrigin: PositionOrigin | null = null
  let currentZIndex = ''
  let dropdownOpen = false

  // UI refs
  const offsetInputs: Record<string, HTMLInputElement> = {}
  const offsetSelects: Record<string, HTMLSelectElement> = {}
  const originBtns: Record<PositionOrigin, HTMLElement> = {} as Record<PositionOrigin, HTMLElement>
  let zIndexInput: HTMLInputElement
  let reorderLabel: HTMLElement
  let dropdownTriggerEl: HTMLElement
  let dropdownMenuEl: HTMLElement
  let dropdownTriggerIcon: HTMLElement
  let dropdownTriggerText: HTMLElement
  let descriptionEl: HTMLElement
  let warningEl: HTMLElement
  let originRow: HTMLElement
  let offsetsPanel: HTMLElement
  let footerEl: HTMLElement
  let relativeToName: HTMLElement

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-pos'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  const dropZone = document.createElement('div')
  dropZone.className = 'flow-pos-drop-zone'
  shadowRoot.appendChild(dropZone)

  // ── Panel Header (shared sub-mode switcher) ──

  const toolHeader = createToolPanelHeader({
    shadowRoot,
    currentModeId: 'position',
  })
  container.appendChild(toolHeader.header)

  // ── Position Type Row ──

  const typeRow = document.createElement('div')
  typeRow.className = 'flow-pos-type-row'

  const typeLabel = document.createElement('span')
  typeLabel.className = 'flow-pos-type-label'
  typeLabel.textContent = 'Position'
  typeRow.appendChild(typeLabel)

  const dropdown = document.createElement('div')
  dropdown.className = 'flow-pos-dropdown'

  dropdownTriggerEl = document.createElement('div')
  dropdownTriggerEl.className = 'flow-pos-dropdown-trigger'

  dropdownTriggerIcon = document.createElement('span')
  dropdownTriggerIcon.innerHTML = POSITION_ICONS.static
  dropdownTriggerEl.appendChild(dropdownTriggerIcon)

  dropdownTriggerText = document.createElement('span')
  dropdownTriggerText.className = 'flow-pos-dropdown-trigger-text'
  dropdownTriggerText.textContent = 'Static'
  dropdownTriggerEl.appendChild(dropdownTriggerText)

  const triggerChevron = document.createElement('span')
  triggerChevron.className = 'flow-pos-dropdown-chevron'
  triggerChevron.textContent = '\u25be'
  dropdownTriggerEl.appendChild(triggerChevron)

  dropdownTriggerEl.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleDropdown()
  })
  dropdown.appendChild(dropdownTriggerEl)

  typeRow.appendChild(dropdown)
  container.appendChild(typeRow)

  // ── Dropdown menu (appended to shadowRoot, NOT inside dropdown, to avoid overflow clipping) ──

  dropdownMenuEl = document.createElement('div')
  dropdownMenuEl.className = 'flow-pos-dropdown-menu'

  for (const type of POSITION_TYPES) {
    const item = document.createElement('div')
    item.className = 'flow-pos-dropdown-item'
    item.dataset.type = type

    const iconSpan = document.createElement('span')
    iconSpan.innerHTML = POSITION_ICONS[type]
    item.appendChild(iconSpan)

    const textSpan = document.createElement('span')
    textSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1)
    item.appendChild(textSpan)

    item.addEventListener('click', (e) => {
      e.stopPropagation()
      setPositionType(type)
      closeDropdown()
    })
    dropdownMenuEl.appendChild(item)
  }

  descriptionEl = document.createElement('div')
  descriptionEl.className = 'flow-pos-dropdown-desc'
  descriptionEl.textContent = POSITION_DESCRIPTIONS.static
  dropdownMenuEl.appendChild(descriptionEl)

  shadowRoot.appendChild(dropdownMenuEl)

  // ── Origin Presets Row ──

  originRow = document.createElement('div')
  originRow.className = 'flow-pos-origin-row'
  originRow.style.display = 'none'

  for (const row of ORIGIN_GRID) {
    for (const origin of row) {
      const btn = document.createElement('div')
      btn.className = 'flow-pos-origin-btn'
      btn.title = origin
      btn.innerHTML = ORIGIN_ICONS[origin]
      btn.addEventListener('click', () => applyOriginPreset(origin))
      originRow.appendChild(btn)
      originBtns[origin] = btn
    }
  }

  // "Full" button (10th)
  const fullBtn = document.createElement('div')
  fullBtn.className = 'flow-pos-origin-btn'
  fullBtn.title = 'Full (all sides 0)'
  fullBtn.innerHTML = ORIGIN_ICONS.full
  fullBtn.addEventListener('click', () => applyOriginPreset('full'))
  originRow.appendChild(fullBtn)
  originBtns.full = fullBtn

  container.appendChild(originRow)

  // ── Offsets Panel ──

  offsetsPanel = document.createElement('div')
  offsetsPanel.className = 'flow-pos-offsets-panel'
  offsetsPanel.style.display = 'none'

  const offsetsGrid = document.createElement('div')
  offsetsGrid.className = 'flow-pos-offsets'

  for (const side of OFFSET_SIDES) {
    const cell = document.createElement('div')
    cell.className = `flow-pos-offset-${side} flow-pos-offset-cell`

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Auto'
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
      if (e.key === 'Escape') input.blur()
      if (e.key.startsWith('Arrow')) e.stopPropagation()
    })
    input.addEventListener('blur', () => commitOffset(side))
    input.addEventListener('focus', () => input.select())
    cell.appendChild(input)
    offsetInputs[side] = input

    const unitSelect = document.createElement('select')
    unitSelect.className = 'flow-pos-unit-select'
    for (const u of UNITS) {
      const opt = document.createElement('option')
      opt.value = u
      opt.textContent = u
      unitSelect.appendChild(opt)
    }
    unitSelect.value = 'px'
    unitSelect.addEventListener('change', () => commitOffset(side))
    unitSelect.addEventListener('mousedown', (e) => e.stopPropagation())
    unitSelect.addEventListener('keydown', (e) => e.stopPropagation())
    cell.appendChild(unitSelect)
    offsetSelects[side] = unitSelect

    offsetsGrid.appendChild(cell)
  }

  // Center box
  const centerWrapper = document.createElement('div')
  centerWrapper.className = 'flow-pos-offset-center'

  const centerBoxEl = document.createElement('div')
  centerBoxEl.className = 'flow-pos-center-box'
  const centerLine = document.createElement('div')
  centerLine.className = 'flow-pos-center-line'
  centerBoxEl.appendChild(centerLine)
  centerWrapper.appendChild(centerBoxEl)
  offsetsGrid.appendChild(centerWrapper)

  offsetsPanel.appendChild(offsetsGrid)
  container.appendChild(offsetsPanel)

  // ── Warning ──

  warningEl = document.createElement('div')
  warningEl.className = 'flow-pos-warning'
  warningEl.style.display = 'none'
  container.appendChild(warningEl)

  // ── Footer: Relative To + Z-Index ──

  footerEl = document.createElement('div')
  footerEl.className = 'flow-pos-footer'
  footerEl.style.display = 'none'

  const leftCol = document.createElement('div')
  leftCol.className = 'flow-pos-footer-col'

  const relativeToBox = document.createElement('div')
  relativeToBox.className = 'flow-pos-relative-to'

  const crosshairSpan = document.createElement('span')
  crosshairSpan.innerHTML = CROSSHAIR_ICON
  relativeToBox.appendChild(crosshairSpan)

  relativeToName = document.createElement('span')
  relativeToName.className = 'flow-pos-relative-to-name'
  relativeToName.textContent = 'body'
  relativeToBox.appendChild(relativeToName)

  leftCol.appendChild(relativeToBox)

  const leftLabel = document.createElement('div')
  leftLabel.className = 'flow-pos-footer-label'
  leftLabel.textContent = 'Relative to'
  leftCol.appendChild(leftLabel)

  footerEl.appendChild(leftCol)

  const rightCol = document.createElement('div')
  rightCol.className = 'flow-pos-footer-col'

  const zIndexCellEl = document.createElement('div')
  zIndexCellEl.className = 'flow-pos-zindex-cell'

  zIndexInput = document.createElement('input')
  zIndexInput.className = 'flow-pos-zindex-input'
  zIndexInput.type = 'text'
  zIndexInput.placeholder = 'Auto'
  zIndexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') zIndexInput.blur()
    if (e.key === 'Escape') zIndexInput.blur()
    if (e.key.startsWith('Arrow')) e.stopPropagation()
  })
  zIndexInput.addEventListener('blur', () => commitZIndex())
  zIndexInput.addEventListener('focus', () => zIndexInput.select())
  zIndexCellEl.appendChild(zIndexInput)

  const zDec = document.createElement('div')
  zDec.className = 'flow-pos-zindex-dec'
  zDec.textContent = '\u2212'
  zDec.addEventListener('click', () => {
    const current = parseInt(zIndexInput.value) || 0
    zIndexInput.value = String(current - 1)
    commitZIndex()
  })
  zIndexCellEl.appendChild(zDec)

  rightCol.appendChild(zIndexCellEl)

  const rightLabel = document.createElement('div')
  rightLabel.className = 'flow-pos-footer-label'
  rightLabel.textContent = 'z-Index'
  rightCol.appendChild(rightLabel)

  footerEl.appendChild(rightCol)
  container.appendChild(footerEl)

  // ── DOM Reorder Section ──

  const reorderSection = document.createElement('div')
  reorderSection.className = 'flow-pos-reorder'

  const reorderHeader = document.createElement('div')
  reorderHeader.className = 'flow-pos-reorder-header'

  const reorderChevron = document.createElement('span')
  reorderChevron.className = 'flow-pos-reorder-chevron'
  reorderChevron.textContent = '\u25be'
  reorderHeader.appendChild(reorderChevron)

  const reorderTitleEl = document.createElement('span')
  reorderTitleEl.className = 'flow-pos-reorder-title'
  reorderTitleEl.textContent = 'DOM Reorder'
  reorderHeader.appendChild(reorderTitleEl)

  reorderHeader.addEventListener('click', () => {
    reorderSection.classList.toggle('collapsed')
    reorderChevron.textContent = reorderSection.classList.contains('collapsed') ? '\u25b8' : '\u25be'
  })
  reorderSection.appendChild(reorderHeader)

  const reorderBody = document.createElement('div')
  reorderBody.className = 'flow-pos-reorder-body'

  reorderLabel = document.createElement('div')
  reorderLabel.className = 'flow-pos-reorder-label'
  reorderLabel.textContent = 'child \u2013 of \u2013'
  reorderBody.appendChild(reorderLabel)

  const reorderHint = document.createElement('div')
  reorderHint.className = 'flow-pos-reorder-hint'
  reorderHint.textContent = '\u2191\u2193 reorder \u00b7 \u2190\u2192 promote/demote \u00b7 Shift = first/last'
  reorderBody.appendChild(reorderHint)

  reorderSection.appendChild(reorderBody)
  container.appendChild(reorderSection)

  // ══════════════════════════════════════════════════════════
  // DROPDOWN (fixed position, rendered as sibling of container)
  // ══════════════════════════════════════════════════════════

  function toggleDropdown() {
    if (dropdownOpen) {
      closeDropdown()
    } else {
      dropdownOpen = true
      dropdownMenuEl.classList.add('open')
      dropdownTriggerEl.classList.add('open')
      descriptionEl.textContent = POSITION_DESCRIPTIONS[currentPositionType]
      dropdownMenuEl.querySelectorAll('.flow-pos-dropdown-item').forEach((item) => {
        (item as HTMLElement).classList.toggle('active', (item as HTMLElement).dataset.type === currentPositionType)
      })
      positionDropdownMenu()
    }
  }

  function positionDropdownMenu() {
    const triggerRect = dropdownTriggerEl.getBoundingClientRect()
    const menuWidth = triggerRect.width
    dropdownMenuEl.style.width = `${menuWidth}px`
    dropdownMenuEl.style.left = `${triggerRect.left}px`

    // Default: below trigger
    let top = triggerRect.bottom + 4
    // Measure menu height (briefly show off-screen to measure)
    dropdownMenuEl.style.top = '-9999px'
    dropdownMenuEl.style.display = 'block'
    const menuHeight = dropdownMenuEl.offsetHeight
    dropdownMenuEl.style.display = ''
    dropdownMenuEl.classList.add('open')

    // Flip above if overflows viewport bottom
    if (top + menuHeight > window.innerHeight - PICKER_MARGIN) {
      top = triggerRect.top - menuHeight - 4
    }
    top = Math.max(PICKER_MARGIN, top)
    dropdownMenuEl.style.top = `${top}px`
  }

  function closeDropdown() {
    dropdownOpen = false
    dropdownMenuEl.classList.remove('open')
    dropdownTriggerEl.classList.remove('open')
  }

  function onDocumentClick() {
    if (dropdownOpen) closeDropdown()
  }

  // Close dropdown on container scroll
  container.addEventListener('scroll', () => {
    if (dropdownOpen) closeDropdown()
  })

  // ══════════════════════════════════════════════════════════
  // POSITION TYPE
  // ══════════════════════════════════════════════════════════

  function setPositionType(type: PositionType) {
    if (!target) return
    currentPositionType = type

    // Update dropdown trigger
    dropdownTriggerIcon.innerHTML = POSITION_ICONS[type]
    dropdownTriggerText.textContent = type.charAt(0).toUpperCase() + type.slice(1)

    // Show/hide origin presets (for absolute, fixed, sticky)
    const showOrigin = type === 'absolute' || type === 'fixed' || type === 'sticky'
    originRow.style.display = showOrigin ? '' : 'none'

    // Show/hide offsets + footer (hidden for static)
    const showOffsets = type !== 'static'
    offsetsPanel.style.display = showOffsets ? '' : 'none'
    footerEl.style.display = showOffsets ? '' : 'none'

    // Update relative-to label
    if (showOffsets) {
      relativeToName.textContent = getRelativeToLabel(target, type)
    }

    // Update warnings
    updateWarning(type)

    // Apply via engine
    engine.applyStyle(target, { position: type })
    onUpdate?.()
  }

  function updateWarning(type: PositionType) {
    if (type === 'sticky') {
      warningEl.textContent = '\u26a0 Sticky requires a scrolling ancestor with overflow'
      warningEl.style.display = ''
    } else if (type === 'absolute') {
      let hasPositionedAncestor = false
      let parent = target?.parentElement
      while (parent && parent !== document.body) {
        const pos = getComputedStyle(parent).position
        if (pos !== 'static') { hasPositionedAncestor = true; break }
        parent = parent.parentElement
      }
      if (!hasPositionedAncestor) {
        warningEl.textContent = '\u26a0 No positioned ancestor \u2014 will be relative to <body>'
        warningEl.style.display = ''
      } else {
        warningEl.style.display = 'none'
      }
    } else {
      warningEl.style.display = 'none'
    }
  }

  // ══════════════════════════════════════════════════════════
  // OFFSETS
  // ══════════════════════════════════════════════════════════

  function commitOffset(side: string) {
    if (!target) return
    const input = offsetInputs[side]
    const select = offsetSelects[side]
    // Auto-resolve any embedded unit (e.g. "16vw" → value: "16", unit: "vw")
    const resolved = resolveInputWithUnit(input, select, 'px')
    const cssValue = buildCssOffset(resolved.value, resolved.unit)
    engine.applyStyle(target, { [side]: cssValue })
    // Re-parse what we set to normalize the display
    const parsed = parseCssOffset(cssValue)
    input.value = parsed.value
    select.value = parsed.unit
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // ORIGIN PRESETS
  // ══════════════════════════════════════════════════════════

  function applyOriginPreset(origin: PositionOrigin) {
    if (!target) return
    currentOrigin = origin

    for (const [o, btn] of Object.entries(originBtns)) {
      btn.classList.toggle('active', o === origin)
    }

    const preset = ORIGIN_PRESETS[origin]
    engine.applyStyle(target, preset)

    for (const side of OFFSET_SIDES) {
      const parsed = parseCssOffset(preset[side])
      offsetInputs[side].value = parsed.value
      offsetSelects[side].value = parsed.unit
    }

    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // Z-INDEX
  // ══════════════════════════════════════════════════════════

  function commitZIndex() {
    if (!target) return
    const value = zIndexInput.value.trim()

    if (value === '' || value.toLowerCase() === 'auto') {
      currentZIndex = ''
      zIndexInput.value = ''
      engine.applyStyle(target, { 'z-index': 'auto' })
    } else if (/^-?\d+$/.test(value)) {
      currentZIndex = value
      engine.applyStyle(target, { 'z-index': value })
    } else {
      zIndexInput.value = currentZIndex
      return
    }
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // DOM REORDER
  // ══════════════════════════════════════════════════════════

  function captureSnapshot(el: HTMLElement): DomSnapshot | null {
    if (!el.parentElement) return null
    return {
      element: el,
      parent: el.parentElement,
      nextSibling: el.nextSibling,
    }
  }

  function restoreSnapshot(snapshot: DomSnapshot): void {
    const { element, parent, nextSibling } = snapshot
    if (nextSibling && nextSibling.parentNode === parent) {
      parent.insertBefore(element, nextSibling)
      return
    }
    parent.appendChild(element)
  }

  function describeSnapshot(snapshot: DomSnapshot): string {
    const siblings = Array.from(snapshot.parent.children)
    const index = siblings.indexOf(snapshot.element)
    const parentLabel = getElementLabel(snapshot.parent)
    if (index === -1) return `detached from ${parentLabel}`
    return `child ${index + 1} of ${siblings.length} in ${parentLabel}`
  }

  function commitReorderMutation(move: () => void): void {
    if (!target) return
    const el = target
    const before = captureSnapshot(el)
    if (!before) return
    const beforeValue = describeSnapshot(before)

    move()

    const after = captureSnapshot(el)
    if (!after) return

    if (before.parent === after.parent && before.nextSibling === after.nextSibling) {
      return
    }

    const afterValue = describeSnapshot(after)
    engine.recordCustomMutation(
      el,
      'structure',
      [
        {
          property: 'dom-order',
          oldValue: beforeValue,
          newValue: afterValue,
        },
      ],
      {
        revert: () => restoreSnapshot(before),
        reapply: () => restoreSnapshot(after),
      }
    )

    flashDropZone(el)
    updateReorderLabel()
    positionNearElement()
    onUpdate?.()
  }

  function moveUp() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    const prev = el.previousElementSibling
    if (!parent || !prev) return
    commitReorderMutation(() => {
      parent.insertBefore(el, prev)
    })
  }

  function moveDown() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    const next = el.nextElementSibling
    if (!parent || !next) return
    commitReorderMutation(() => {
      parent.insertBefore(el, next.nextSibling)
    })
  }

  function moveToFirst() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    if (!parent || parent.firstElementChild === el) return
    commitReorderMutation(() => {
      parent.insertBefore(el, parent.firstChild)
    })
  }

  function moveToLast() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    if (!parent || parent.lastElementChild === el) return
    commitReorderMutation(() => {
      parent.appendChild(el)
    })
  }

  function promote() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    const grandParent = parent?.parentElement
    if (!parent || !grandParent) return
    commitReorderMutation(() => {
      grandParent.insertBefore(el, parent)
    })
  }

  function demote() {
    if (!target) return
    const el = target
    const parent = el.parentElement
    const prev = el.previousElementSibling
    if (!parent || !prev) return
    commitReorderMutation(() => {
      prev.appendChild(el)
    })
  }

  function flashDropZone(el: Element) {
    const rect = el.getBoundingClientRect()
    dropZone.style.left = `${rect.left}px`
    dropZone.style.top = `${rect.top}px`
    dropZone.style.width = `${rect.width}px`
    dropZone.style.height = `${rect.height}px`
    dropZone.style.display = 'block'
    setTimeout(() => { dropZone.style.display = 'none' }, 300)
  }

  function updateReorderLabel() {
    if (!target || !target.parentElement) {
      reorderLabel.textContent = 'child \u2013 of \u2013'
      return
    }
    const siblings = Array.from(target.parentElement.children)
    const index = siblings.indexOf(target)
    reorderLabel.textContent = `child ${index + 1} of ${siblings.length}`
  }

  // ══════════════════════════════════════════════════════════
  // KEYBOARD
  // ══════════════════════════════════════════════════════════

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    if (shouldIgnoreKeyboardShortcut(e)) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) { moveToFirst() } else { moveUp() }
        break
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) { moveToLast() } else { moveDown() }
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
      case 'Escape':
        if (dropdownOpen) {
          e.preventDefault()
          e.stopPropagation()
          closeDropdown()
        }
        break
      default:
        return
    }
  }

  // ══════════════════════════════════════════════════════════
  // READ STATE FROM ELEMENT
  // ══════════════════════════════════════════════════════════

  function readFromElement(el: HTMLElement) {
    const computed = getComputedStyle(el)

    // Position type
    currentPositionType = (computed.position || 'static') as PositionType
    dropdownTriggerIcon.innerHTML = POSITION_ICONS[currentPositionType]
    dropdownTriggerText.textContent = currentPositionType.charAt(0).toUpperCase() + currentPositionType.slice(1)

    // Show/hide origin presets
    const showOrigin = currentPositionType === 'absolute' || currentPositionType === 'fixed' || currentPositionType === 'sticky'
    originRow.style.display = showOrigin ? '' : 'none'

    // Show/hide offsets + footer
    const showOffsets = currentPositionType !== 'static'
    offsetsPanel.style.display = showOffsets ? '' : 'none'
    footerEl.style.display = showOffsets ? '' : 'none'

    // Update warnings
    updateWarning(currentPositionType)

    // Read offsets
    for (const side of OFFSET_SIDES) {
      const raw = computed.getPropertyValue(side)
      const parsed = parseCssOffset(raw)
      offsetInputs[side].value = parsed.value
      offsetSelects[side].value = parsed.unit
    }

    // Clear origin highlight
    currentOrigin = null
    for (const btn of Object.values(originBtns)) {
      btn.classList.remove('active')
    }

    // Z-index
    const z = computed.zIndex
    currentZIndex = z === 'auto' ? '' : z
    zIndexInput.value = currentZIndex

    // Relative-to label
    if (showOffsets) {
      relativeToName.textContent = getRelativeToLabel(el, currentPositionType)
    }

    // Reorder label
    updateReorderLabel()
  }

  // ══════════════════════════════════════════════════════════
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    const pos = computeToolPanelPosition(target, 260, container.offsetHeight || 400)
    container.style.left = `${pos.left}px`
    container.style.top = `${pos.top}px`
  }

  function onScrollOrResize() {
    positionNearElement()
    if (dropdownOpen) closeDropdown()
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      closeDropdown()
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
      closeDropdown()
      container.style.display = 'none'
      dropZone.style.display = 'none'
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      closeDropdown()
      toolHeader.destroy()
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      dropZone.remove()
      dropdownMenuEl.remove()
      styleEl.remove()
    },
  }
}
