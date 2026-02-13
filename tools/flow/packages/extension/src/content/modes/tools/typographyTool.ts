/**
 * Typography Tool — Design Sub-Mode 6
 *
 * Figma-style floating panel controlling typography properties on the selected element:
 * - Font family (dropdown)
 * - Font weight (dropdown: 100-900)
 * - Font size + unit (px/rem/em/%)
 * - Line height + unit (unitless/px/rem/em/normal)
 * - Letter spacing + unit (em/px/rem)
 * - Font style (normal/italic/oblique toggle row)
 * - Text align (left/center/right/justify toggle row)
 * - Text decoration (none/underline/line-through/overline toggle row)
 * - Text transform (none/uppercase/lowercase/capitalize toggle row)
 * - Word spacing + unit (em/px/rem)
 * - Text indent + unit (px/rem/em/%)
 * - Text shadow (X/Y/blur/color)
 * - Color (swatch + hex input)
 *
 * Keyboard: Arrow Up/Down adjusts font-size (1px, Shift=10px)
 *
 * Ported from the panel's TypographySection.tsx into the content-script tool pattern.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { resolveInputWithUnit } from './unitInput'
import styles from './typographyTool.css?inline'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'

// ── Types ──

export interface TypographyToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface TypographyTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Constants ──

const PICKER_MARGIN = 8

const FONT_WEIGHTS = [
  { value: '100', label: '100 - Thin' },
  { value: '200', label: '200 - Extra Light' },
  { value: '300', label: '300 - Light' },
  { value: '400', label: '400 - Regular' },
  { value: '500', label: '500 - Medium' },
  { value: '600', label: '600 - Semi Bold' },
  { value: '700', label: '700 - Bold' },
  { value: '800', label: '800 - Extra Bold' },
  { value: '900', label: '900 - Black' },
]

const THEME_FONTS = [
  'Inter', 'Geist', 'Geist Mono', 'SF Pro', 'system-ui', 'monospace',
]

const SYSTEM_FONTS: { label: string; value: string }[] = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

type FontStyle = 'normal' | 'italic' | 'oblique'
type TextAlign = 'left' | 'center' | 'right' | 'justify'
type TextDecoration = 'none' | 'underline' | 'line-through' | 'overline'
type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'

// SVG icon helpers (inline, matching TypographySection.tsx)

const ALIGN_ICONS: Record<TextAlign, string> = {
  left: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>',
  center: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  right: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>',
  justify: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
}

const DECORATION_ICONS: Record<TextDecoration, string> = {
  none: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  underline: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
  'line-through': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 7a5.998 5.998 0 0 0-6-5H7v10"/><path d="M3 12h18"/><path d="M7 17v2a3 3 0 0 0 6 0v-2"/></svg>',
  overline: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="3" x2="20" y2="3"/><path d="M6 21v-7a6 6 0 0 1 12 0v7"/></svg>',
}

const FONT_STYLE_LABELS: Record<FontStyle, string> = {
  normal: 'N',
  italic: 'I',
  oblique: 'O',
}

const TRANSFORM_LABELS: Record<TextTransform, string> = {
  none: '-',
  uppercase: 'AA',
  lowercase: 'aa',
  capitalize: 'Aa',
}

// ── CSS value parser ──

function parseCssValue(cssValue: string, defaultUnit: string = 'px'): { value: string; unit: string } {
  if (!cssValue || cssValue === 'normal') return { value: '', unit: defaultUnit }
  const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)?$/i)
  if (match) return { value: match[1], unit: match[2] || defaultUnit }
  return { value: cssValue, unit: '' }
}

// ── Tool Implementation ──

export function createTypographyTool(options: TypographyToolOptions): TypographyTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // State
  let fontFamily = 'Inter'
  let fontWeight = '400'
  let fontStyleVal: FontStyle = 'normal'
  let fontSize = { value: '16', unit: 'px' }
  let lineHeight = { value: '1.5', unit: '' }
  let letterSpacing = { value: '0', unit: 'em' }
  let wordSpacing = { value: '0', unit: 'em' }
  let textIndent = { value: '0', unit: 'px' }
  let textAlign: TextAlign = 'left'
  let textDecoration: TextDecoration = 'none'
  let textTransform: TextTransform = 'none'
  let textColor = '#000000'
  let shadowX = 0
  let shadowY = 0
  let shadowBlur = 0
  let shadowColor = '#000000'

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-typography'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Scrub label helper ──

  function attachScrub(
    labelEl: HTMLElement,
    getValue: () => number,
    setValue: (v: number) => void,
    min: number,
    max: number,
    step: number,
  ) {
    let startX = 0
    let startVal = 0
    let isScrubbing = false

    function onPointerDown(e: PointerEvent) {
      startX = e.clientX
      startVal = getValue()
      isScrubbing = true
      labelEl.classList.add('scrubbing')
      labelEl.setPointerCapture(e.pointerId)
      e.preventDefault()
    }

    function onPointerMove(e: PointerEvent) {
      if (!isScrubbing) return
      const dx = e.clientX - startX
      const range = max - min
      const sensitivity = range / 200
      const raw = startVal + dx * sensitivity
      const clamped = Math.max(min, Math.min(max, raw))
      const stepped = Math.round(clamped / step) * step
      setValue(stepped)
    }

    function onPointerUp() {
      isScrubbing = false
      labelEl.classList.remove('scrubbing')
    }

    labelEl.addEventListener('pointerdown', onPointerDown)
    labelEl.addEventListener('pointermove', onPointerMove)
    labelEl.addEventListener('pointerup', onPointerUp)
    labelEl.addEventListener('pointercancel', onPointerUp)
  }

  // ── Collapsible section helper ──

  function createSection(title: string, collapsed: boolean = false): { section: HTMLElement; body: HTMLElement } {
    const section = document.createElement('div')
    section.className = `flow-typo-section${collapsed ? ' collapsed' : ''}`

    const header = document.createElement('div')
    header.className = 'flow-typo-header'

    const chevron = document.createElement('span')
    chevron.className = 'flow-typo-chevron'
    chevron.textContent = '▾'
    header.appendChild(chevron)

    const titleEl = document.createElement('span')
    titleEl.className = 'flow-typo-title'
    titleEl.textContent = title
    header.appendChild(titleEl)

    header.addEventListener('click', () => section.classList.toggle('collapsed'))
    section.appendChild(header)

    const body = document.createElement('div')
    body.className = 'flow-typo-body'
    section.appendChild(body)

    container.appendChild(section)
    return { section, body }
  }

  // ══════════════════════════════════════════════════════════
  // BUILD UI
  // ══════════════════════════════════════════════════════════

  // ── Top bar: Font Family + Weight ──

  const topbar = document.createElement('div')
  topbar.className = 'flow-typo-topbar'
  container.appendChild(topbar)

  // Font Family row
  const fontFamilyRow = document.createElement('div')
  fontFamilyRow.className = 'flow-typo-row'

  const fontFamilyLabel = document.createElement('span')
  fontFamilyLabel.className = 'flow-typo-static-label'
  fontFamilyLabel.textContent = 'Font'
  fontFamilyRow.appendChild(fontFamilyLabel)

  const fontFamilySelect = document.createElement('select')
  fontFamilySelect.className = 'flow-typo-select'

  const themeGroup = document.createElement('optgroup')
  themeGroup.label = 'Theme Fonts'
  for (const font of THEME_FONTS) {
    const opt = document.createElement('option')
    opt.value = font
    opt.textContent = font
    themeGroup.appendChild(opt)
  }
  fontFamilySelect.appendChild(themeGroup)

  const systemGroup = document.createElement('optgroup')
  systemGroup.label = 'System'
  for (const font of SYSTEM_FONTS) {
    const opt = document.createElement('option')
    opt.value = font.value
    opt.textContent = font.label
    systemGroup.appendChild(opt)
  }
  fontFamilySelect.appendChild(systemGroup)

  fontFamilySelect.addEventListener('change', () => {
    fontFamily = fontFamilySelect.value
    applyFontFamily()
  })
  fontFamilyRow.appendChild(fontFamilySelect)
  topbar.appendChild(fontFamilyRow)

  // Font Weight row
  const fontWeightRow = document.createElement('div')
  fontWeightRow.className = 'flow-typo-row'

  const fontWeightLabel = document.createElement('span')
  fontWeightLabel.className = 'flow-typo-static-label'
  fontWeightLabel.textContent = 'Weight'
  fontWeightRow.appendChild(fontWeightLabel)

  const fontWeightSelect = document.createElement('select')
  fontWeightSelect.className = 'flow-typo-select'
  for (const w of FONT_WEIGHTS) {
    const opt = document.createElement('option')
    opt.value = w.value
    opt.textContent = w.label
    fontWeightSelect.appendChild(opt)
  }
  fontWeightSelect.addEventListener('change', () => {
    fontWeight = fontWeightSelect.value
    applyFontWeight()
  })
  fontWeightRow.appendChild(fontWeightSelect)
  topbar.appendChild(fontWeightRow)

  // Font Style row
  const fontStyleRow = document.createElement('div')
  fontStyleRow.className = 'flow-typo-row'
  const fontStyleLabel = document.createElement('span')
  fontStyleLabel.className = 'flow-typo-static-label'
  fontStyleLabel.textContent = 'Style'
  fontStyleRow.appendChild(fontStyleLabel)

  const fontStyleToggles = document.createElement('div')
  fontStyleToggles.className = 'flow-typo-toggles'
  const fontStyleButtons: Record<FontStyle, HTMLButtonElement> = {} as any
  for (const fs of ['normal', 'italic', 'oblique'] as FontStyle[]) {
    const btn = document.createElement('button')
    btn.className = 'flow-typo-toggle-btn'
    btn.textContent = FONT_STYLE_LABELS[fs]
    btn.title = fs.charAt(0).toUpperCase() + fs.slice(1)
    if (fs === 'italic') btn.style.fontStyle = 'italic'
    if (fs === 'oblique') btn.style.fontStyle = 'oblique'
    btn.addEventListener('click', () => {
      fontStyleVal = fs
      updateFontStyleButtons()
      applyFontStyle()
    })
    fontStyleToggles.appendChild(btn)
    fontStyleButtons[fs] = btn
  }
  fontStyleRow.appendChild(fontStyleToggles)
  topbar.appendChild(fontStyleRow)

  function updateFontStyleButtons() {
    for (const s of ['normal', 'italic', 'oblique'] as FontStyle[]) {
      fontStyleButtons[s].classList.toggle('active', s === fontStyleVal)
    }
  }

  // ── Size Section: Font Size, Line Height, Letter Spacing, Word Spacing, Text Indent ──

  const { body: sizeBody } = createSection('Size', false)

  // Font Size + Line Height grid
  const sizeGrid = document.createElement('div')
  sizeGrid.className = 'flow-typo-grid'
  sizeBody.appendChild(sizeGrid)

  // Helper: create an input+unit wrapped in a single container
  const SIZE_UNITS = ['px', '%', 'em', 'rem', 'ch', 'vw', 'vh', 'svw', 'svh']
  const SPACING_UNITS = ['em', 'px', 'rem', 'ch', 'vw']

  function createInputWithUnit(
    parent: HTMLElement,
    input: HTMLInputElement,
    unitSelect: HTMLSelectElement,
  ) {
    const wrap = document.createElement('div')
    wrap.className = 'flow-typo-input-wrap'
    input.className = 'flow-typo-input'
    unitSelect.className = 'flow-typo-unit'
    wrap.appendChild(input)
    wrap.appendChild(unitSelect)
    parent.appendChild(wrap)
  }

  function populateUnitSelect(select: HTMLSelectElement, units: { v: string; l: string }[]) {
    for (const u of units) {
      const opt = document.createElement('option')
      opt.value = u.v
      opt.textContent = u.l
      select.appendChild(opt)
    }
  }

  // Font Size cell
  const fontSizeCell = document.createElement('div')
  fontSizeCell.className = 'flow-typo-grid-cell'

  const fontSizeLabel = document.createElement('span')
  fontSizeLabel.className = 'flow-typo-grid-label'
  fontSizeLabel.textContent = 'Sz'
  fontSizeCell.appendChild(fontSizeLabel)

  const fontSizeInput = document.createElement('input')
  fontSizeInput.type = 'text'
  fontSizeInput.value = '16'

  const fontSizeUnit = document.createElement('select')
  populateUnitSelect(fontSizeUnit, SIZE_UNITS.map(u => ({ v: u, l: u.toUpperCase() })))

  createInputWithUnit(fontSizeCell, fontSizeInput, fontSizeUnit)
  sizeGrid.appendChild(fontSizeCell)

  // Line Height cell
  const lineHeightCell = document.createElement('div')
  lineHeightCell.className = 'flow-typo-grid-cell'

  const lineHeightLabel = document.createElement('span')
  lineHeightLabel.className = 'flow-typo-grid-label'
  lineHeightLabel.textContent = 'Lh'
  lineHeightCell.appendChild(lineHeightLabel)

  const lineHeightInput = document.createElement('input')
  lineHeightInput.type = 'text'
  lineHeightInput.value = '1.5'

  const lineHeightUnit = document.createElement('select')
  populateUnitSelect(lineHeightUnit, [
    { v: '', l: '-' }, { v: 'px', l: 'PX' }, { v: 'rem', l: 'REM' },
    { v: 'em', l: 'EM' }, { v: 'normal', l: 'AUTO' },
  ])

  createInputWithUnit(lineHeightCell, lineHeightInput, lineHeightUnit)
  sizeGrid.appendChild(lineHeightCell)

  // Letter Spacing row
  const spacingRow = document.createElement('div')
  spacingRow.className = 'flow-typo-row'

  const spacingLabel = document.createElement('span')
  spacingLabel.className = 'flow-typo-label'
  spacingLabel.textContent = 'Spacing'
  spacingRow.appendChild(spacingLabel)

  const spacingInput = document.createElement('input')
  spacingInput.type = 'text'
  spacingInput.value = '0'

  const spacingUnit = document.createElement('select')
  populateUnitSelect(spacingUnit, SPACING_UNITS.map(u => ({ v: u, l: u.toUpperCase() })))

  createInputWithUnit(spacingRow, spacingInput, spacingUnit)
  sizeBody.appendChild(spacingRow)

  // Word Spacing row
  const wordSpacingRow = document.createElement('div')
  wordSpacingRow.className = 'flow-typo-row'

  const wordSpacingLabel = document.createElement('span')
  wordSpacingLabel.className = 'flow-typo-label'
  wordSpacingLabel.textContent = 'Word'
  wordSpacingRow.appendChild(wordSpacingLabel)

  const wordSpacingInput = document.createElement('input')
  wordSpacingInput.type = 'text'
  wordSpacingInput.value = '0'

  const wordSpacingUnit = document.createElement('select')
  populateUnitSelect(wordSpacingUnit, SPACING_UNITS.map(u => ({ v: u, l: u.toUpperCase() })))

  createInputWithUnit(wordSpacingRow, wordSpacingInput, wordSpacingUnit)
  sizeBody.appendChild(wordSpacingRow)

  // Text Indent row
  const textIndentRow = document.createElement('div')
  textIndentRow.className = 'flow-typo-row'

  const textIndentLabel = document.createElement('span')
  textIndentLabel.className = 'flow-typo-label'
  textIndentLabel.textContent = 'Indent'
  textIndentRow.appendChild(textIndentLabel)

  const textIndentInput = document.createElement('input')
  textIndentInput.type = 'text'
  textIndentInput.value = '0'

  const textIndentUnit = document.createElement('select')
  populateUnitSelect(textIndentUnit, SIZE_UNITS.map(u => ({ v: u, l: u.toUpperCase() })))

  createInputWithUnit(textIndentRow, textIndentInput, textIndentUnit)
  sizeBody.appendChild(textIndentRow)

  // Wire size input events

  function commitFontSize() {
    const resolved = resolveInputWithUnit(fontSizeInput, fontSizeUnit, 'px')
    if (!resolved.value || isNaN(parseFloat(resolved.value))) return
    fontSize = { value: resolved.value, unit: resolved.unit }
    applyFontSize()
  }

  fontSizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitFontSize(); fontSizeInput.blur() }
    if (e.key === 'Escape') fontSizeInput.blur()
  })
  fontSizeInput.addEventListener('blur', commitFontSize)
  fontSizeInput.addEventListener('focus', () => fontSizeInput.select())

  fontSizeUnit.addEventListener('change', () => {
    fontSize = { ...fontSize, unit: fontSizeUnit.value }
    applyFontSize()
  })

  attachScrub(fontSizeLabel, () => parseFloat(fontSizeInput.value) || 0, (v) => {
    fontSizeInput.value = String(Math.round(v * 10) / 10)
    fontSize = { value: fontSizeInput.value, unit: fontSizeUnit.value }
    applyFontSize()
  }, 0, 200, 1)

  function commitLineHeight() {
    const resolved = resolveInputWithUnit(lineHeightInput, lineHeightUnit)
    if (!resolved.value || isNaN(parseFloat(resolved.value))) return
    lineHeight = { value: resolved.value, unit: resolved.unit }
    applyLineHeight()
  }

  lineHeightInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitLineHeight(); lineHeightInput.blur() }
    if (e.key === 'Escape') lineHeightInput.blur()
  })
  lineHeightInput.addEventListener('blur', commitLineHeight)
  lineHeightInput.addEventListener('focus', () => lineHeightInput.select())

  lineHeightUnit.addEventListener('change', () => {
    if (lineHeightUnit.value === 'normal') {
      lineHeightInput.value = ''
      lineHeight = { value: '', unit: 'normal' }
    } else {
      lineHeight = { ...lineHeight, unit: lineHeightUnit.value }
    }
    applyLineHeight()
  })

  function commitLetterSpacing() {
    const resolved = resolveInputWithUnit(spacingInput, spacingUnit, 'em')
    if (!resolved.value || isNaN(parseFloat(resolved.value))) return
    letterSpacing = { value: resolved.value, unit: resolved.unit }
    applyLetterSpacing()
  }

  spacingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitLetterSpacing(); spacingInput.blur() }
    if (e.key === 'Escape') spacingInput.blur()
  })
  spacingInput.addEventListener('blur', commitLetterSpacing)
  spacingInput.addEventListener('focus', () => spacingInput.select())

  spacingUnit.addEventListener('change', () => {
    letterSpacing = { ...letterSpacing, unit: spacingUnit.value }
    applyLetterSpacing()
  })

  attachScrub(spacingLabel, () => parseFloat(spacingInput.value) || 0, (v) => {
    spacingInput.value = String(Math.round(v * 100) / 100)
    letterSpacing = { value: spacingInput.value, unit: spacingUnit.value }
    applyLetterSpacing()
  }, -1, 2, 0.01)

  // Word spacing events
  function commitWordSpacing() {
    const resolved = resolveInputWithUnit(wordSpacingInput, wordSpacingUnit, 'em')
    if (!resolved.value || isNaN(parseFloat(resolved.value))) return
    wordSpacing = { value: resolved.value, unit: resolved.unit }
    applyWordSpacing()
  }

  wordSpacingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitWordSpacing(); wordSpacingInput.blur() }
    if (e.key === 'Escape') wordSpacingInput.blur()
  })
  wordSpacingInput.addEventListener('blur', commitWordSpacing)
  wordSpacingInput.addEventListener('focus', () => wordSpacingInput.select())

  wordSpacingUnit.addEventListener('change', () => {
    wordSpacing = { ...wordSpacing, unit: wordSpacingUnit.value }
    applyWordSpacing()
  })

  attachScrub(wordSpacingLabel, () => parseFloat(wordSpacingInput.value) || 0, (v) => {
    wordSpacingInput.value = String(Math.round(v * 100) / 100)
    wordSpacing = { value: wordSpacingInput.value, unit: wordSpacingUnit.value }
    applyWordSpacing()
  }, -1, 2, 0.01)

  // Text indent events
  function commitTextIndent() {
    const resolved = resolveInputWithUnit(textIndentInput, textIndentUnit, 'px')
    if (!resolved.value || isNaN(parseFloat(resolved.value))) return
    textIndent = { value: resolved.value, unit: resolved.unit }
    applyTextIndent()
  }

  textIndentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitTextIndent(); textIndentInput.blur() }
    if (e.key === 'Escape') textIndentInput.blur()
  })
  textIndentInput.addEventListener('blur', commitTextIndent)
  textIndentInput.addEventListener('focus', () => textIndentInput.select())

  textIndentUnit.addEventListener('change', () => {
    textIndent = { ...textIndent, unit: textIndentUnit.value }
    applyTextIndent()
  })

  attachScrub(textIndentLabel, () => parseFloat(textIndentInput.value) || 0, (v) => {
    textIndentInput.value = String(Math.round(v))
    textIndent = { value: textIndentInput.value, unit: textIndentUnit.value }
    applyTextIndent()
  }, -100, 200, 1)

  // ── Style Section: Align, Font Style, Decoration, Transform ──

  const { body: styleBody } = createSection('Style', false)

  // Text Align row
  const alignRow = document.createElement('div')
  alignRow.className = 'flow-typo-row'
  const alignLabel = document.createElement('span')
  alignLabel.className = 'flow-typo-static-label'
  alignLabel.textContent = 'Align'
  alignRow.appendChild(alignLabel)

  const alignToggles = document.createElement('div')
  alignToggles.className = 'flow-typo-toggles'
  const alignButtons: Record<TextAlign, HTMLButtonElement> = {} as any
  for (const align of ['left', 'center', 'right', 'justify'] as TextAlign[]) {
    const btn = document.createElement('button')
    btn.className = 'flow-typo-toggle-btn'
    btn.innerHTML = ALIGN_ICONS[align]
    btn.title = align.charAt(0).toUpperCase() + align.slice(1)
    btn.addEventListener('click', () => {
      textAlign = align
      updateAlignButtons()
      applyTextAlign()
    })
    alignToggles.appendChild(btn)
    alignButtons[align] = btn
  }
  alignRow.appendChild(alignToggles)
  styleBody.appendChild(alignRow)

  function updateAlignButtons() {
    for (const a of ['left', 'center', 'right', 'justify'] as TextAlign[]) {
      alignButtons[a].classList.toggle('active', a === textAlign)
    }
  }

  // Text Decoration row
  const decoRow = document.createElement('div')
  decoRow.className = 'flow-typo-row'
  const decoLabel = document.createElement('span')
  decoLabel.className = 'flow-typo-static-label'
  decoLabel.textContent = 'Deco'
  decoRow.appendChild(decoLabel)

  const decoToggles = document.createElement('div')
  decoToggles.className = 'flow-typo-toggles'
  const decoButtons: Record<TextDecoration, HTMLButtonElement> = {} as any
  for (const deco of ['none', 'underline', 'line-through', 'overline'] as TextDecoration[]) {
    const btn = document.createElement('button')
    btn.className = 'flow-typo-toggle-btn'
    btn.innerHTML = DECORATION_ICONS[deco]
    btn.title = deco === 'none' ? 'None' : deco === 'line-through' ? 'Strikethrough' : deco.charAt(0).toUpperCase() + deco.slice(1)
    btn.addEventListener('click', () => {
      textDecoration = deco
      updateDecoButtons()
      applyTextDecoration()
    })
    decoToggles.appendChild(btn)
    decoButtons[deco] = btn
  }
  decoRow.appendChild(decoToggles)
  styleBody.appendChild(decoRow)

  function updateDecoButtons() {
    for (const d of ['none', 'underline', 'line-through', 'overline'] as TextDecoration[]) {
      decoButtons[d].classList.toggle('active', d === textDecoration)
    }
  }

  // Text Transform row
  const transformRow = document.createElement('div')
  transformRow.className = 'flow-typo-row'
  const transformLabel = document.createElement('span')
  transformLabel.className = 'flow-typo-static-label'
  transformLabel.textContent = 'Case'
  transformRow.appendChild(transformLabel)

  const transformToggles = document.createElement('div')
  transformToggles.className = 'flow-typo-toggles'
  const transformButtons: Record<TextTransform, HTMLButtonElement> = {} as any
  for (const tt of ['none', 'uppercase', 'lowercase', 'capitalize'] as TextTransform[]) {
    const btn = document.createElement('button')
    btn.className = 'flow-typo-toggle-btn'
    btn.textContent = TRANSFORM_LABELS[tt]
    btn.title = tt === 'none' ? 'None' : tt.charAt(0).toUpperCase() + tt.slice(1)
    btn.addEventListener('click', () => {
      textTransform = tt
      updateTransformButtons()
      applyTextTransform()
    })
    transformToggles.appendChild(btn)
    transformButtons[tt] = btn
  }
  transformRow.appendChild(transformToggles)
  styleBody.appendChild(transformRow)

  function updateTransformButtons() {
    for (const t of ['none', 'uppercase', 'lowercase', 'capitalize'] as TextTransform[]) {
      transformButtons[t].classList.toggle('active', t === textTransform)
    }
  }

  // ── Text Shadow Section ──

  const { body: textShadowBody } = createSection('Text Shadow', true)

  // X / Y grid
  const tsXYGrid = document.createElement('div')
  tsXYGrid.className = 'flow-typo-grid'
  textShadowBody.appendChild(tsXYGrid)

  // Shadow X cell
  const tsXCell = document.createElement('div')
  tsXCell.className = 'flow-typo-grid-cell'
  const tsXLabel = document.createElement('span')
  tsXLabel.className = 'flow-typo-grid-label'
  tsXLabel.textContent = 'X'
  tsXCell.appendChild(tsXLabel)
  const tsXInput = document.createElement('input')
  tsXInput.type = 'text'
  tsXInput.className = 'flow-typo-input-solo'
  tsXInput.value = '0'
  tsXCell.appendChild(tsXInput)
  tsXYGrid.appendChild(tsXCell)

  // Shadow Y cell
  const tsYCell = document.createElement('div')
  tsYCell.className = 'flow-typo-grid-cell'
  const tsYLabel = document.createElement('span')
  tsYLabel.className = 'flow-typo-grid-label'
  tsYLabel.textContent = 'Y'
  tsYCell.appendChild(tsYLabel)
  const tsYInput = document.createElement('input')
  tsYInput.type = 'text'
  tsYInput.className = 'flow-typo-input-solo'
  tsYInput.value = '0'
  tsYCell.appendChild(tsYInput)
  tsXYGrid.appendChild(tsYCell)

  // Blur row
  const tsBlurRow = document.createElement('div')
  tsBlurRow.className = 'flow-typo-row'
  const tsBlurLabel = document.createElement('span')
  tsBlurLabel.className = 'flow-typo-label'
  tsBlurLabel.textContent = 'Blur'
  tsBlurRow.appendChild(tsBlurLabel)
  const tsBlurInput = document.createElement('input')
  tsBlurInput.type = 'text'
  tsBlurInput.className = 'flow-typo-input-solo'
  tsBlurInput.value = '0'
  tsBlurRow.appendChild(tsBlurInput)
  textShadowBody.appendChild(tsBlurRow)

  // Shadow color row
  const tsColorRow = document.createElement('div')
  tsColorRow.className = 'flow-typo-color-row'

  const tsSwatch = document.createElement('input')
  tsSwatch.type = 'color'
  tsSwatch.className = 'flow-typo-swatch'
  tsSwatch.value = '#000000'
  tsSwatch.addEventListener('input', () => {
    shadowColor = tsSwatch.value
    tsHexInput.value = tsSwatch.value.toUpperCase()
    applyTextShadow()
  })
  tsColorRow.appendChild(tsSwatch)

  const tsHexInput = document.createElement('input')
  tsHexInput.type = 'text'
  tsHexInput.className = 'flow-typo-hex-input'
  tsHexInput.value = '#000000'
  tsHexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tsHexInput.blur()
  })
  tsHexInput.addEventListener('blur', () => {
    let v = tsHexInput.value.trim()
    if (!v.startsWith('#')) v = '#' + v
    if (/^#[0-9a-fA-F]{3,6}$/.test(v)) {
      tsSwatch.value = v
      shadowColor = v
      tsHexInput.value = v.toUpperCase()
      applyTextShadow()
    } else {
      tsHexInput.value = tsSwatch.value.toUpperCase()
    }
  })
  tsHexInput.addEventListener('focus', () => tsHexInput.select())
  tsColorRow.appendChild(tsHexInput)
  textShadowBody.appendChild(tsColorRow)

  // Wire text-shadow input events
  function commitShadowInput(input: HTMLInputElement, setter: (v: number) => void) {
    const v = parseFloat(input.value)
    if (isNaN(v)) return
    setter(v)
    applyTextShadow()
  }

  for (const [input, setter] of [
    [tsXInput, (v: number) => { shadowX = v }],
    [tsYInput, (v: number) => { shadowY = v }],
    [tsBlurInput, (v: number) => { shadowBlur = Math.max(0, v) }],
  ] as [HTMLInputElement, (v: number) => void][]) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commitShadowInput(input, setter); input.blur() }
      if (e.key === 'Escape') input.blur()
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const delta = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)
        const next = parseFloat(input.value) + delta
        input.value = String(Math.round(next))
        setter(next)
        applyTextShadow()
      }
    })
    input.addEventListener('blur', () => commitShadowInput(input, setter))
    input.addEventListener('focus', () => input.select())
  }

  attachScrub(tsXLabel, () => shadowX, (v) => {
    shadowX = v; tsXInput.value = String(Math.round(v)); applyTextShadow()
  }, -50, 50, 1)

  attachScrub(tsYLabel, () => shadowY, (v) => {
    shadowY = v; tsYInput.value = String(Math.round(v)); applyTextShadow()
  }, -50, 50, 1)

  attachScrub(tsBlurLabel, () => shadowBlur, (v) => {
    shadowBlur = Math.max(0, v); tsBlurInput.value = String(Math.round(shadowBlur)); applyTextShadow()
  }, 0, 50, 1)

  // ── Color Section ──

  const { body: colorBody } = createSection('Color', false)

  const colorRow = document.createElement('div')
  colorRow.className = 'flow-typo-color-row'

  const colorSwatch = document.createElement('input')
  colorSwatch.type = 'color'
  colorSwatch.className = 'flow-typo-swatch'
  colorSwatch.value = '#000000'
  colorSwatch.addEventListener('input', () => {
    textColor = colorSwatch.value
    hexInput.value = colorSwatch.value.toUpperCase()
    applyColor()
  })
  colorRow.appendChild(colorSwatch)

  const hexInput = document.createElement('input')
  hexInput.type = 'text'
  hexInput.className = 'flow-typo-hex-input'
  hexInput.value = '#000000'
  hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') hexInput.blur()
  })
  hexInput.addEventListener('blur', () => {
    let v = hexInput.value.trim()
    if (!v.startsWith('#')) v = '#' + v
    if (/^#[0-9a-fA-F]{3,6}$/.test(v)) {
      colorSwatch.value = v
      textColor = v
      hexInput.value = v.toUpperCase()
      applyColor()
    } else {
      hexInput.value = colorSwatch.value.toUpperCase()
    }
  })
  hexInput.addEventListener('focus', () => hexInput.select())
  colorRow.appendChild(hexInput)
  colorBody.appendChild(colorRow)

  // ══════════════════════════════════════════════════════════
  // APPLY FUNCTIONS
  // ══════════════════════════════════════════════════════════

  function applyFontFamily() {
    if (!target) return
    engine.applyStyle(target, { 'font-family': fontFamily })
    onUpdate?.()
  }

  function applyFontWeight() {
    if (!target) return
    engine.applyStyle(target, { 'font-weight': fontWeight })
    onUpdate?.()
  }

  function applyFontStyle() {
    if (!target) return
    engine.applyStyle(target, { 'font-style': fontStyleVal })
    onUpdate?.()
  }

  function applyFontSize() {
    if (!target) return
    const val = fontSize.value
    if (!val) return
    engine.applyStyle(target, { 'font-size': `${val}${fontSize.unit}` })
    onUpdate?.()
  }

  function applyLineHeight() {
    if (!target) return
    if (lineHeight.unit === 'normal') {
      engine.applyStyle(target, { 'line-height': 'normal' })
    } else {
      const val = lineHeight.value
      if (!val) return
      const unit = lineHeight.unit // '' = unitless
      engine.applyStyle(target, { 'line-height': `${val}${unit}` })
    }
    onUpdate?.()
  }

  function applyLetterSpacing() {
    if (!target) return
    const val = letterSpacing.value
    if (!val) return
    engine.applyStyle(target, { 'letter-spacing': `${val}${letterSpacing.unit}` })
    onUpdate?.()
  }

  function applyWordSpacing() {
    if (!target) return
    const val = wordSpacing.value
    if (!val) return
    engine.applyStyle(target, { 'word-spacing': `${val}${wordSpacing.unit}` })
    onUpdate?.()
  }

  function applyTextIndent() {
    if (!target) return
    const val = textIndent.value
    if (!val) return
    engine.applyStyle(target, { 'text-indent': `${val}${textIndent.unit}` })
    onUpdate?.()
  }

  function applyTextAlign() {
    if (!target) return
    engine.applyStyle(target, { 'text-align': textAlign })
    onUpdate?.()
  }

  function applyTextDecoration() {
    if (!target) return
    engine.applyStyle(target, { 'text-decoration': textDecoration })
    onUpdate?.()
  }

  function applyTextTransform() {
    if (!target) return
    engine.applyStyle(target, { 'text-transform': textTransform })
    onUpdate?.()
  }

  function applyTextShadow() {
    if (!target) return
    if (shadowX === 0 && shadowY === 0 && shadowBlur === 0) {
      engine.applyStyle(target, { 'text-shadow': 'none' })
    } else {
      engine.applyStyle(target, { 'text-shadow': `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}` })
    }
    onUpdate?.()
  }

  function applyColor() {
    if (!target) return
    engine.applyStyle(target, { color: textColor })
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // READ STATE FROM ELEMENT
  // ══════════════════════════════════════════════════════════

  function readFromElement(element: HTMLElement) {
    const computed = getComputedStyle(element)

    // Font family — strip quotes, take first
    fontFamily = computed.fontFamily.split(',')[0].trim().replace(/['"]/g, '')
    fontFamilySelect.value = fontFamily
    // If not in the select options, check system fonts
    if (!fontFamilySelect.value) {
      for (const sf of SYSTEM_FONTS) {
        if (sf.value.toLowerCase().startsWith(fontFamily.toLowerCase())) {
          fontFamilySelect.value = sf.value
          fontFamily = sf.value
          break
        }
      }
    }

    // Font weight
    fontWeight = computed.fontWeight
    fontWeightSelect.value = fontWeight

    // Font style
    const computedStyle = computed.fontStyle
    if (computedStyle === 'italic') fontStyleVal = 'italic'
    else if (computedStyle === 'oblique') fontStyleVal = 'oblique'
    else fontStyleVal = 'normal'
    updateFontStyleButtons()

    // Font size
    const parsedSize = parseCssValue(computed.fontSize, 'px')
    fontSize = { value: parsedSize.value, unit: parsedSize.unit || 'px' }
    fontSizeInput.value = parsedSize.value
    fontSizeUnit.value = fontSize.unit

    // Line height — if 'normal', show that; otherwise parse
    if (computed.lineHeight === 'normal') {
      lineHeight = { value: '', unit: 'normal' }
      lineHeightInput.value = ''
      lineHeightUnit.value = 'normal'
    } else {
      // Computed line-height is always in px; try to detect unitless ratio
      const lhPx = parseFloat(computed.lineHeight)
      const fsPx = parseFloat(computed.fontSize)
      if (fsPx > 0) {
        const ratio = Math.round((lhPx / fsPx) * 100) / 100
        // If it looks like a clean ratio, show unitless
        if (ratio >= 0.5 && ratio <= 5) {
          lineHeight = { value: String(ratio), unit: '' }
          lineHeightInput.value = String(ratio)
          lineHeightUnit.value = ''
        } else {
          lineHeight = { value: String(Math.round(lhPx)), unit: 'px' }
          lineHeightInput.value = String(Math.round(lhPx))
          lineHeightUnit.value = 'px'
        }
      }
    }

    // Letter spacing
    if (computed.letterSpacing === 'normal' || computed.letterSpacing === '0px') {
      letterSpacing = { value: '0', unit: 'em' }
      spacingInput.value = '0'
      spacingUnit.value = 'em'
    } else {
      const parsedSpacing = parseCssValue(computed.letterSpacing, 'px')
      // Convert px to em if possible
      const fsPx = parseFloat(computed.fontSize)
      if (parsedSpacing.unit === 'px' && fsPx > 0) {
        const emVal = Math.round((parseFloat(parsedSpacing.value) / fsPx) * 100) / 100
        letterSpacing = { value: String(emVal), unit: 'em' }
        spacingInput.value = String(emVal)
        spacingUnit.value = 'em'
      } else {
        letterSpacing = { value: parsedSpacing.value, unit: parsedSpacing.unit || 'em' }
        spacingInput.value = parsedSpacing.value
        spacingUnit.value = letterSpacing.unit
      }
    }

    // Word spacing
    if (computed.wordSpacing === 'normal' || computed.wordSpacing === '0px') {
      wordSpacing = { value: '0', unit: 'em' }
      wordSpacingInput.value = '0'
      wordSpacingUnit.value = 'em'
    } else {
      const parsedWS = parseCssValue(computed.wordSpacing, 'px')
      const fsPx2 = parseFloat(computed.fontSize)
      if (parsedWS.unit === 'px' && fsPx2 > 0) {
        const emVal = Math.round((parseFloat(parsedWS.value) / fsPx2) * 100) / 100
        wordSpacing = { value: String(emVal), unit: 'em' }
        wordSpacingInput.value = String(emVal)
        wordSpacingUnit.value = 'em'
      } else {
        wordSpacing = { value: parsedWS.value, unit: parsedWS.unit || 'em' }
        wordSpacingInput.value = parsedWS.value
        wordSpacingUnit.value = wordSpacing.unit
      }
    }

    // Text indent
    if (computed.textIndent === '0px' || !computed.textIndent) {
      textIndent = { value: '0', unit: 'px' }
      textIndentInput.value = '0'
      textIndentUnit.value = 'px'
    } else {
      const parsedIndent = parseCssValue(computed.textIndent, 'px')
      textIndent = { value: parsedIndent.value, unit: parsedIndent.unit || 'px' }
      textIndentInput.value = parsedIndent.value
      textIndentUnit.value = textIndent.unit
    }

    // Text shadow
    const tsShadow = computed.textShadow
    if (tsShadow && tsShadow !== 'none') {
      // Parse "rgba(r,g,b,a) Xpx Ypx Bpx" or "Xpx Ypx Bpx #color"
      // Computed text-shadow is typically "rgb(r, g, b) Xpx Ypx Bpx"
      const rgbMatch = tsShadow.match(/^(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/)
      if (rgbMatch) {
        shadowX = parseFloat(rgbMatch[2])
        shadowY = parseFloat(rgbMatch[3])
        shadowBlur = parseFloat(rgbMatch[4])
        // Convert rgb to hex for swatch
        try {
          const ctx = document.createElement('canvas').getContext('2d')
          if (ctx) {
            ctx.fillStyle = rgbMatch[1]
            shadowColor = ctx.fillStyle.startsWith('#') ? ctx.fillStyle : '#000000'
          }
        } catch { shadowColor = '#000000' }
      }
    } else {
      shadowX = 0
      shadowY = 0
      shadowBlur = 0
      shadowColor = '#000000'
    }
    tsXInput.value = String(Math.round(shadowX))
    tsYInput.value = String(Math.round(shadowY))
    tsBlurInput.value = String(Math.round(shadowBlur))
    tsSwatch.value = shadowColor
    tsHexInput.value = shadowColor.toUpperCase()

    // Text align
    textAlign = (computed.textAlign as TextAlign) || 'left'
    // Normalize 'start' to 'left', 'end' to 'right'
    if (textAlign === 'start' as any) textAlign = 'left'
    if (textAlign === 'end' as any) textAlign = 'right'
    updateAlignButtons()

    // Text decoration — extract the keyword (may have color/style parts)
    const decoLine = computed.textDecorationLine || computed.textDecoration
    if (decoLine.includes('underline')) textDecoration = 'underline'
    else if (decoLine.includes('line-through')) textDecoration = 'line-through'
    else if (decoLine.includes('overline')) textDecoration = 'overline'
    else textDecoration = 'none'
    updateDecoButtons()

    // Text transform
    textTransform = (computed.textTransform as TextTransform) || 'none'
    updateTransformButtons()

    // Color
    try {
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.fillStyle = computed.color
        const hex = ctx.fillStyle.startsWith('#') ? ctx.fillStyle : '#000000'
        textColor = hex
        colorSwatch.value = hex
        hexInput.value = hex.toUpperCase()
      }
    } catch {
      textColor = '#000000'
      colorSwatch.value = '#000000'
      hexInput.value = '#000000'
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

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    if (shouldIgnoreKeyboardShortcut(e)) return

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      const step = e.shiftKey ? 10 : 1
      const delta = e.key === 'ArrowUp' ? step : -step
      const current = parseFloat(fontSize.value) || 16
      const next = Math.max(1, current + delta)
      fontSize = { ...fontSize, value: String(next) }
      fontSizeInput.value = String(next)
      applyFontSize()
    }
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    attach(element: HTMLElement) {
      target = element
      readFromElement(element)
      container.style.display = ''
      positionNearElement()
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
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
      styleEl.remove()
    },
  }
}
