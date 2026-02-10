/**
 * Effects Tool — Design Sub-Mode 6
 *
 * Figma-style floating panel controlling visual effects on the selected element:
 * - Opacity (element-level) with filled slider track
 * - Blend mode (mix-blend-mode) dropdown
 * - Box shadow (X/Y grid, blur/spread grid, color swatch + hex, inset toggle)
 * - Backdrop filter (blur, brightness, contrast, saturate)
 * - Filter (blur, brightness, contrast, grayscale, sepia, hue-rotate, invert, saturate)
 *
 * UI patterns matching Figma's design panel:
 * - Scrub labels (click+drag on label text to adjust value)
 * - Filled slider tracks showing value position
 * - Compact inline number inputs (editable, commit on Enter/blur)
 * - Grid rows for paired values (X/Y, Blur/Spread)
 * - Collapsible sections with chevron + title
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { parseBoxShadow, stringifyBoxShadow, type ParsedBoxShadow } from '../../../panel/components/designer/boxShadowParser'
import { BLEND_MODES } from './colorTokens'
import styles from './effectsTool.css?inline'

// ── Types ──

export interface EffectsToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface EffectsTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

// ── Filter Defaults ──

const BACKDROP_DEFAULTS: Record<string, number> = {
  blur: 0, brightness: 1, contrast: 1, saturate: 1,
}

const FILTER_DEFAULTS: Record<string, number> = {
  blur: 0, brightness: 1, contrast: 1, grayscale: 0,
  sepia: 0, hueRotate: 0, invert: 0, saturate: 1,
}

// ── Filter helpers ──

function buildFilterString(values: Record<string, number>, defaults: Record<string, number>): string {
  const parts: string[] = []
  for (const [fn, val] of Object.entries(values)) {
    if (val === defaults[fn]) continue
    switch (fn) {
      case 'blur': parts.push(`blur(${val}px)`); break
      case 'hueRotate': parts.push(`hue-rotate(${val}deg)`); break
      default: parts.push(`${fn}(${val})`); break
    }
  }
  return parts.length > 0 ? parts.join(' ') : 'none'
}

function parseFilterString(css: string, defaults: Record<string, number>): Record<string, number> {
  const result = { ...defaults }
  if (!css || css === 'none') return result
  const regex = /([\w-]+)\(([^)]+)\)/g
  let match
  while ((match = regex.exec(css)) !== null) {
    const [, fn, val] = match
    const num = parseFloat(val)
    if (fn === 'hue-rotate') result.hueRotate = num
    else if (fn in result) result[fn] = num
  }
  return result
}

// ── Constants ──

const PICKER_MARGIN = 8

// ── Tool Implementation ──

export function createEffectsTool(options: EffectsToolOptions): EffectsTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null

  // State
  let opacity = 100
  let blendMode = 'normal'
  let shadow: ParsedBoxShadow = { offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0.25)', inset: false }
  let backdrop = { ...BACKDROP_DEFAULTS }
  let filter = { ...FILTER_DEFAULTS }

  // UI refs for programmatic updates
  const inputRefs: Record<string, {
    slider?: HTMLInputElement
    fill?: HTMLElement
    input: HTMLInputElement
    min: number
    max: number
    unit: string
    displayMultiplier: number
  }> = {}

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-effects'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Scrub label helper ──
  // Click+drag on labels to adjust value — Figma's signature interaction

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
      // ~2px per step for fine control
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

  // ── Figma-style slider row: label + filled slider + number input ──

  function createPropertyRow(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    unit: string,
    displayMultiplier: number,
    onChange: (value: number) => void,
    id?: string,
  ) {
    const row = document.createElement('div')
    row.className = 'flow-fx-row'

    // Scrub label
    const lbl = document.createElement('span')
    lbl.className = 'flow-fx-label'
    lbl.textContent = label
    row.appendChild(lbl)

    // Slider wrap with fill
    const sliderWrap = document.createElement('div')
    sliderWrap.className = 'flow-fx-slider-wrap'

    const fill = document.createElement('div')
    fill.className = 'flow-fx-slider-fill'
    sliderWrap.appendChild(fill)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.className = 'flow-fx-slider'
    slider.min = String(min)
    slider.max = String(max)
    slider.step = String(step)
    slider.value = String(initial)
    sliderWrap.appendChild(slider)

    row.appendChild(sliderWrap)

    // Number input
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'flow-fx-input'
    input.value = formatDisplay(initial, unit, displayMultiplier)
    row.appendChild(input)

    // Update fill width
    function updateFill(v: number) {
      const pct = ((v - min) / (max - min)) * 100
      fill.style.width = `${pct}%`
    }
    updateFill(initial)

    // Slider → onChange
    slider.addEventListener('input', () => {
      const v = Number(slider.value)
      input.value = formatDisplay(v, unit, displayMultiplier)
      updateFill(v)
      onChange(v)
    })

    // Input → onChange (commit on Enter or blur)
    function commitInput() {
      const raw = parseFloat(input.value)
      if (isNaN(raw)) {
        input.value = formatDisplay(Number(slider.value), unit, displayMultiplier)
        return
      }
      const actual = displayMultiplier !== 1 ? raw / displayMultiplier : raw
      const clamped = Math.max(min, Math.min(max, actual))
      slider.value = String(clamped)
      input.value = formatDisplay(clamped, unit, displayMultiplier)
      updateFill(clamped)
      onChange(clamped)
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commitInput(); input.blur() }
      if (e.key === 'Escape') { input.value = formatDisplay(Number(slider.value), unit, displayMultiplier); input.blur() }
      // Arrow keys for fine adjustment
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? step : -step
        const v = Math.max(min, Math.min(max, Number(slider.value) + delta))
        slider.value = String(v)
        input.value = formatDisplay(v, unit, displayMultiplier)
        updateFill(v)
        onChange(v)
      }
    })
    input.addEventListener('blur', commitInput)
    input.addEventListener('focus', () => input.select())

    // Scrub label
    attachScrub(lbl, () => Number(slider.value), (v) => {
      slider.value = String(v)
      input.value = formatDisplay(v, unit, displayMultiplier)
      updateFill(v)
      onChange(v)
    }, min, max, step)

    parent.appendChild(row)

    if (id) {
      inputRefs[id] = { slider, fill, input, min, max, unit, displayMultiplier }
    }
  }

  function formatDisplay(v: number, unit: string, mult: number): string {
    const display = mult !== 1 ? Math.round(v * mult) : Math.round(v * 100) / 100
    return `${display}${unit}`
  }

  // ── Grid input cell (for X/Y, Blur/Spread pairs) ──

  function createGridInput(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    onChange: (value: number) => void,
    id?: string,
  ) {
    const cell = document.createElement('div')
    cell.className = 'flow-fx-grid-cell'

    const lbl = document.createElement('span')
    lbl.className = 'flow-fx-grid-label'
    lbl.textContent = label
    cell.appendChild(lbl)

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'flow-fx-grid-input'
    input.value = String(initial)
    cell.appendChild(input)

    function commit() {
      const raw = parseFloat(input.value)
      if (isNaN(raw)) { input.value = String(initial); return }
      const clamped = Math.max(min, Math.min(max, Math.round(raw / step) * step))
      input.value = String(clamped)
      onChange(clamped)
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commit(); input.blur() }
      if (e.key === 'Escape') input.blur()
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const delta = (e.key === 'ArrowUp' ? step : -step) * (e.shiftKey ? 10 : 1)
        const v = Math.max(min, Math.min(max, parseFloat(input.value) + delta))
        input.value = String(Math.round(v))
        onChange(v)
      }
    })
    input.addEventListener('blur', commit)
    input.addEventListener('focus', () => input.select())

    // Scrub on label
    attachScrub(lbl, () => parseFloat(input.value), (v) => {
      input.value = String(Math.round(v))
      onChange(v)
    }, min, max, step)

    parent.appendChild(cell)

    if (id) {
      inputRefs[id] = { input, min, max, unit: '', displayMultiplier: 1 }
    }
  }

  // ── Collapsible section ──

  function createSection(title: string, collapsed: boolean = false): { section: HTMLElement; body: HTMLElement } {
    const section = document.createElement('div')
    section.className = `flow-fx-section${collapsed ? ' collapsed' : ''}`

    const header = document.createElement('div')
    header.className = 'flow-fx-header'

    const chevron = document.createElement('span')
    chevron.className = 'flow-fx-chevron'
    chevron.textContent = '▾'
    header.appendChild(chevron)

    const titleEl = document.createElement('span')
    titleEl.className = 'flow-fx-title'
    titleEl.textContent = title
    header.appendChild(titleEl)

    header.addEventListener('click', () => section.classList.toggle('collapsed'))
    section.appendChild(header)

    const body = document.createElement('div')
    body.className = 'flow-fx-body'
    section.appendChild(body)

    container.appendChild(section)
    return { section, body }
  }

  // ══════════════════════════════════════════════════════════
  // BUILD UI
  // ══════════════════════════════════════════════════════════

  // ── Top bar: Opacity + Blend ──

  const topbar = document.createElement('div')
  topbar.className = 'flow-fx-topbar'
  container.appendChild(topbar)

  createPropertyRow(topbar, 'Opacity', 0, 100, 1, 100, '%', 1, (v) => {
    opacity = v
    applyOpacity()
  }, 'opacity')

  // Blend mode row
  const blendRow = document.createElement('div')
  blendRow.className = 'flow-fx-row'
  const blendLabel = document.createElement('span')
  blendLabel.className = 'flow-fx-label'
  blendLabel.textContent = 'Blend'
  blendRow.appendChild(blendLabel)

  const blendSelect = document.createElement('select')
  blendSelect.className = 'flow-fx-select'
  for (const mode of BLEND_MODES) {
    const opt = document.createElement('option')
    opt.value = mode
    opt.textContent = mode
    blendSelect.appendChild(opt)
  }
  blendSelect.addEventListener('change', () => {
    blendMode = blendSelect.value
    applyBlendMode()
  })
  blendRow.appendChild(blendSelect)
  topbar.appendChild(blendRow)

  // ── Box Shadow Section ──

  const { section: shadowSection, body: shadowBody } = createSection('Drop Shadow', true)

  // X / Y grid
  const xyGrid = document.createElement('div')
  xyGrid.className = 'flow-fx-grid'
  shadowBody.appendChild(xyGrid)

  createGridInput(xyGrid, 'X', -50, 50, 1, 0, (v) => {
    shadow.offsetX = v; applyShadow()
  }, 'shadowX')

  createGridInput(xyGrid, 'Y', -50, 50, 1, 0, (v) => {
    shadow.offsetY = v; applyShadow()
  }, 'shadowY')

  // Blur / Spread grid
  const bsGrid = document.createElement('div')
  bsGrid.className = 'flow-fx-grid'
  shadowBody.appendChild(bsGrid)

  createGridInput(bsGrid, 'B', 0, 100, 1, 0, (v) => {
    shadow.blur = v; applyShadow()
  }, 'shadowBlur')

  createGridInput(bsGrid, 'S', -50, 50, 1, 0, (v) => {
    shadow.spread = v; applyShadow()
  }, 'shadowSpread')

  // Color row: swatch + hex input + inset toggle
  const colorRow = document.createElement('div')
  colorRow.className = 'flow-fx-color-row'

  const colorSwatch = document.createElement('input')
  colorSwatch.type = 'color'
  colorSwatch.className = 'flow-fx-swatch'
  colorSwatch.value = '#000000'
  colorSwatch.addEventListener('input', () => {
    shadow.color = colorSwatch.value
    hexInput.value = colorSwatch.value.toUpperCase()
    applyShadow()
  })
  colorRow.appendChild(colorSwatch)

  const hexInput = document.createElement('input')
  hexInput.type = 'text'
  hexInput.className = 'flow-fx-hex-input'
  hexInput.value = '#000000'
  hexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { hexInput.blur() }
  })
  hexInput.addEventListener('blur', () => {
    let v = hexInput.value.trim()
    if (!v.startsWith('#')) v = '#' + v
    if (/^#[0-9a-fA-F]{3,6}$/.test(v)) {
      colorSwatch.value = v
      shadow.color = v
      hexInput.value = v.toUpperCase()
      applyShadow()
    } else {
      hexInput.value = colorSwatch.value.toUpperCase()
    }
  })
  hexInput.addEventListener('focus', () => hexInput.select())
  colorRow.appendChild(hexInput)

  const insetToggle = document.createElement('div')
  insetToggle.className = 'flow-fx-toggle'
  insetToggle.textContent = 'Inset'
  const insetCheckbox = document.createElement('input')
  insetCheckbox.type = 'checkbox'
  insetCheckbox.style.display = 'none'
  insetToggle.appendChild(insetCheckbox)
  insetToggle.addEventListener('click', () => {
    shadow.inset = !shadow.inset
    insetCheckbox.checked = shadow.inset
    insetToggle.classList.toggle('active', shadow.inset)
    applyShadow()
  })
  colorRow.appendChild(insetToggle)

  shadowBody.appendChild(colorRow)

  // ── Backdrop Filter Section ──

  const { section: backdropSection, body: backdropBody } = createSection('Backdrop Filter', true)

  createPropertyRow(backdropBody, 'Blur', 0, 50, 0.5, 0, 'px', 1, (v) => {
    backdrop.blur = v; applyBackdrop()
  }, 'backdropBlur')

  createPropertyRow(backdropBody, 'Brightness', 0, 2, 0.01, 1, '%', 100, (v) => {
    backdrop.brightness = v; applyBackdrop()
  }, 'backdropBrightness')

  createPropertyRow(backdropBody, 'Contrast', 0, 2, 0.01, 1, '%', 100, (v) => {
    backdrop.contrast = v; applyBackdrop()
  }, 'backdropContrast')

  createPropertyRow(backdropBody, 'Saturate', 0, 2, 0.01, 1, '%', 100, (v) => {
    backdrop.saturate = v; applyBackdrop()
  }, 'backdropSaturate')

  // ── Filter Section ──

  const { section: filterSection, body: filterBody } = createSection('Filter', true)

  createPropertyRow(filterBody, 'Blur', 0, 50, 0.5, 0, 'px', 1, (v) => {
    filter.blur = v; applyFilter()
  }, 'filterBlur')

  createPropertyRow(filterBody, 'Brightness', 0, 2, 0.01, 1, '%', 100, (v) => {
    filter.brightness = v; applyFilter()
  }, 'filterBrightness')

  createPropertyRow(filterBody, 'Contrast', 0, 2, 0.01, 1, '%', 100, (v) => {
    filter.contrast = v; applyFilter()
  }, 'filterContrast')

  createPropertyRow(filterBody, 'Grayscale', 0, 1, 0.01, 0, '%', 100, (v) => {
    filter.grayscale = v; applyFilter()
  }, 'filterGrayscale')

  createPropertyRow(filterBody, 'Sepia', 0, 1, 0.01, 0, '%', 100, (v) => {
    filter.sepia = v; applyFilter()
  }, 'filterSepia')

  createPropertyRow(filterBody, 'Hue Rotate', 0, 360, 1, 0, '°', 1, (v) => {
    filter.hueRotate = v; applyFilter()
  }, 'filterHueRotate')

  createPropertyRow(filterBody, 'Invert', 0, 1, 0.01, 0, '%', 100, (v) => {
    filter.invert = v; applyFilter()
  }, 'filterInvert')

  createPropertyRow(filterBody, 'Saturate', 0, 2, 0.01, 1, '%', 100, (v) => {
    filter.saturate = v; applyFilter()
  }, 'filterSaturate')

  // ══════════════════════════════════════════════════════════
  // APPLY FUNCTIONS
  // ══════════════════════════════════════════════════════════

  function applyOpacity() {
    if (!target) return
    engine.applyStyle(target, { opacity: String(opacity / 100) })
    onUpdate?.()
  }

  function applyBlendMode() {
    if (!target) return
    engine.applyStyle(target, { 'mix-blend-mode': blendMode })
    onUpdate?.()
  }

  function applyShadow() {
    if (!target) return
    engine.applyStyle(target, { 'box-shadow': stringifyBoxShadow([shadow]) })
    onUpdate?.()
  }

  function applyBackdrop() {
    if (!target) return
    const str = buildFilterString(backdrop, BACKDROP_DEFAULTS)
    engine.applyStyle(target, { 'backdrop-filter': str, '-webkit-backdrop-filter': str })
    onUpdate?.()
  }

  function applyFilter() {
    if (!target) return
    engine.applyStyle(target, { filter: buildFilterString(filter, FILTER_DEFAULTS) })
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // READ STATE FROM ELEMENT
  // ══════════════════════════════════════════════════════════

  function updateRef(id: string, value: number) {
    const ref = inputRefs[id]
    if (!ref) return
    if (ref.slider) ref.slider.value = String(value)
    if (ref.fill) {
      const pct = ((value - ref.min) / (ref.max - ref.min)) * 100
      ref.fill.style.width = `${pct}%`
    }
    ref.input.value = formatDisplay(value, ref.unit, ref.displayMultiplier)
  }

  function updateGridRef(id: string, value: number) {
    const ref = inputRefs[id]
    if (!ref) return
    ref.input.value = String(Math.round(value))
  }

  function readFromElement(element: HTMLElement) {
    const computed = getComputedStyle(element)

    // Opacity
    opacity = Math.round(parseFloat(computed.opacity) * 100)
    updateRef('opacity', opacity)

    // Blend mode
    blendMode = computed.mixBlendMode || 'normal'
    blendSelect.value = blendMode

    // Box shadow
    const shadows = parseBoxShadow(computed.boxShadow)
    if (shadows.length > 0) {
      shadow = { ...shadows[0] }
    } else {
      shadow = { offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0.25)', inset: false }
    }
    updateGridRef('shadowX', shadow.offsetX)
    updateGridRef('shadowY', shadow.offsetY)
    updateGridRef('shadowBlur', shadow.blur)
    updateGridRef('shadowSpread', shadow.spread)
    insetCheckbox.checked = shadow.inset
    insetToggle.classList.toggle('active', shadow.inset)

    // Color swatch
    try {
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.fillStyle = shadow.color
        const hex = ctx.fillStyle.startsWith('#') ? ctx.fillStyle : '#000000'
        colorSwatch.value = hex
        hexInput.value = hex.toUpperCase()
      }
    } catch {
      colorSwatch.value = '#000000'
      hexInput.value = '#000000'
    }

    // Backdrop filter
    const bdFilter = computed.getPropertyValue('backdrop-filter') || computed.getPropertyValue('-webkit-backdrop-filter') || 'none'
    backdrop = parseFilterString(bdFilter, BACKDROP_DEFAULTS)
    updateRef('backdropBlur', backdrop.blur)
    updateRef('backdropBrightness', backdrop.brightness)
    updateRef('backdropContrast', backdrop.contrast)
    updateRef('backdropSaturate', backdrop.saturate)

    // Filter
    const flt = computed.filter || 'none'
    filter = parseFilterString(flt, FILTER_DEFAULTS)
    updateRef('filterBlur', filter.blur)
    updateRef('filterBrightness', filter.brightness)
    updateRef('filterContrast', filter.contrast)
    updateRef('filterGrayscale', filter.grayscale)
    updateRef('filterSepia', filter.sepia)
    updateRef('filterHueRotate', filter.hueRotate)
    updateRef('filterInvert', filter.invert)
    updateRef('filterSaturate', filter.saturate)

    // Auto-expand sections with non-default values
    const hasNonDefaultShadow = shadows.length > 0 && (
      shadow.offsetX !== 0 || shadow.offsetY !== 0 || shadow.blur !== 0 || shadow.spread !== 0
    )
    const hasNonDefaultBackdrop = Object.keys(BACKDROP_DEFAULTS).some(k => backdrop[k] !== BACKDROP_DEFAULTS[k])
    const hasNonDefaultFilter = Object.keys(FILTER_DEFAULTS).some(k => filter[k] !== FILTER_DEFAULTS[k])

    shadowSection.classList.toggle('collapsed', !hasNonDefaultShadow)
    backdropSection.classList.toggle('collapsed', !hasNonDefaultBackdrop)
    filterSection.classList.toggle('collapsed', !hasNonDefaultFilter)
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
      readFromElement(element)
      container.style.display = ''
      positionNearElement()
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      styleEl.remove()
    },
  }
}
