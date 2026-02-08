/**
 * Effects Tool — Design Sub-Mode 6
 *
 * Floating popover controlling visual effects on the selected element:
 * - Opacity (element-level)
 * - Blend mode (mix-blend-mode)
 * - Box shadow (parsed via boxShadowParser)
 * - Backdrop filter (blur, brightness, contrast, saturate)
 * - Filter (blur, brightness, contrast, grayscale, sepia, hue-rotate, invert, saturate)
 *
 * Sections are collapsible. Only sections with non-default values expand on attach.
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
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturate: 1,
}

const FILTER_DEFAULTS: Record<string, number> = {
  blur: 0,
  brightness: 1,
  contrast: 1,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  saturate: 1,
}

// ── Filter helpers ──

function buildFilterString(values: Record<string, number>, defaults: Record<string, number>): string {
  const parts: string[] = []
  for (const [fn, val] of Object.entries(values)) {
    if (val === defaults[fn]) continue
    switch (fn) {
      case 'blur':
        parts.push(`blur(${val}px)`)
        break
      case 'hueRotate':
        parts.push(`hue-rotate(${val}deg)`)
        break
      case 'brightness':
      case 'contrast':
      case 'saturate':
      case 'grayscale':
      case 'sepia':
      case 'invert':
        parts.push(`${fn}(${val})`)
        break
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

  // UI references for updating slider values on attach
  const sliderRefs: Record<string, { slider: HTMLInputElement; valueEl: HTMLSpanElement }> = {}

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-effects'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Helper: create slider row ──

  function createSliderRow(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    unit: string,
    onChange: (value: number) => void,
    id?: string,
  ): { slider: HTMLInputElement; valueEl: HTMLSpanElement } {
    const row = document.createElement('div')
    row.className = 'flow-fx-row'

    const lbl = document.createElement('span')
    lbl.className = 'flow-fx-label'
    lbl.textContent = label
    row.appendChild(lbl)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.className = 'flow-fx-slider'
    slider.min = String(min)
    slider.max = String(max)
    slider.step = String(step)
    slider.value = String(initial)
    row.appendChild(slider)

    const valueEl = document.createElement('span')
    valueEl.className = 'flow-fx-value'
    valueEl.textContent = formatValue(initial, unit)
    row.appendChild(valueEl)

    slider.addEventListener('input', () => {
      const v = Number(slider.value)
      valueEl.textContent = formatValue(v, unit)
      onChange(v)
    })

    parent.appendChild(row)

    const ref = { slider, valueEl }
    if (id) sliderRefs[id] = ref
    return ref
  }

  function formatValue(v: number, unit: string): string {
    // For percentage units, multiply by 100 for display
    if (unit === '%' && v <= 2) return `${Math.round(v * 100)}%`
    if (unit === '%') return `${Math.round(v)}%`
    return `${Math.round(v * 100) / 100}${unit}`
  }

  // ── Helper: create collapsible section ──

  function createSection(title: string, collapsed: boolean = false): { section: HTMLElement; body: HTMLElement } {
    const section = document.createElement('div')
    section.className = `flow-fx-section${collapsed ? ' collapsed' : ''}`

    const header = document.createElement('div')
    header.className = 'flow-fx-header'
    header.innerHTML = `<span class="flow-fx-chevron">▼</span> ${title}`
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed')
    })
    section.appendChild(header)

    const body = document.createElement('div')
    body.className = 'flow-fx-body'
    section.appendChild(body)

    container.appendChild(section)
    return { section, body }
  }

  // ── 1. Opacity Row ──

  const opacitySection = document.createElement('div')
  opacitySection.className = 'flow-fx-section'
  container.appendChild(opacitySection)

  const opacityBody = document.createElement('div')
  opacityBody.className = 'flow-fx-body'
  opacitySection.appendChild(opacityBody)

  createSliderRow(opacityBody, 'Opacity', 0, 100, 1, 100, '%', (v) => {
    opacity = v
    applyOpacity()
  }, 'opacity')

  // ── 2. Blend Mode Row ──

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
  opacityBody.appendChild(blendRow)

  // ── 3. Box Shadow Section ──

  const { section: shadowSection, body: shadowBody } = createSection('Box Shadow', true)

  // Shadow offset X/Y
  createSliderRow(shadowBody, 'X', -50, 50, 1, 0, 'px', (v) => {
    shadow.offsetX = v
    applyShadow()
  }, 'shadowX')

  createSliderRow(shadowBody, 'Y', -50, 50, 1, 0, 'px', (v) => {
    shadow.offsetY = v
    applyShadow()
  }, 'shadowY')

  createSliderRow(shadowBody, 'Blur', 0, 100, 1, 0, 'px', (v) => {
    shadow.blur = v
    applyShadow()
  }, 'shadowBlur')

  createSliderRow(shadowBody, 'Spread', -50, 50, 1, 0, 'px', (v) => {
    shadow.spread = v
    applyShadow()
  }, 'shadowSpread')

  // Shadow color + inset row
  const shadowMetaRow = document.createElement('div')
  shadowMetaRow.className = 'flow-fx-row'

  const colorLabel = document.createElement('span')
  colorLabel.className = 'flow-fx-label'
  colorLabel.textContent = 'Color'
  shadowMetaRow.appendChild(colorLabel)

  const colorSwatch = document.createElement('input')
  colorSwatch.type = 'color'
  colorSwatch.className = 'flow-fx-swatch'
  colorSwatch.value = '#000000'
  colorSwatch.addEventListener('input', () => {
    shadow.color = colorSwatch.value
    applyShadow()
  })
  shadowMetaRow.appendChild(colorSwatch)

  const insetToggle = document.createElement('label')
  insetToggle.className = 'flow-fx-toggle'
  const insetCheckbox = document.createElement('input')
  insetCheckbox.type = 'checkbox'
  insetCheckbox.addEventListener('change', () => {
    shadow.inset = insetCheckbox.checked
    applyShadow()
  })
  insetToggle.appendChild(insetCheckbox)
  insetToggle.appendChild(document.createTextNode(' Inset'))
  shadowMetaRow.appendChild(insetToggle)

  shadowBody.appendChild(shadowMetaRow)

  // ── 4. Backdrop Filter Section ──

  const { section: backdropSection, body: backdropBody } = createSection('Backdrop Filter', true)

  createSliderRow(backdropBody, 'Blur', 0, 50, 0.5, 0, 'px', (v) => {
    backdrop.blur = v
    applyBackdrop()
  }, 'backdropBlur')

  createSliderRow(backdropBody, 'Bright', 0, 2, 0.01, 1, '%', (v) => {
    backdrop.brightness = v
    applyBackdrop()
  }, 'backdropBrightness')

  createSliderRow(backdropBody, 'Contrast', 0, 2, 0.01, 1, '%', (v) => {
    backdrop.contrast = v
    applyBackdrop()
  }, 'backdropContrast')

  createSliderRow(backdropBody, 'Saturate', 0, 2, 0.01, 1, '%', (v) => {
    backdrop.saturate = v
    applyBackdrop()
  }, 'backdropSaturate')

  // ── 5. Filter Section ──

  const { section: filterSection, body: filterBody } = createSection('Filter', true)

  createSliderRow(filterBody, 'Blur', 0, 50, 0.5, 0, 'px', (v) => {
    filter.blur = v
    applyFilter()
  }, 'filterBlur')

  createSliderRow(filterBody, 'Bright', 0, 2, 0.01, 1, '%', (v) => {
    filter.brightness = v
    applyFilter()
  }, 'filterBrightness')

  createSliderRow(filterBody, 'Contrast', 0, 2, 0.01, 1, '%', (v) => {
    filter.contrast = v
    applyFilter()
  }, 'filterContrast')

  createSliderRow(filterBody, 'Grayscale', 0, 1, 0.01, 0, '%', (v) => {
    filter.grayscale = v
    applyFilter()
  }, 'filterGrayscale')

  createSliderRow(filterBody, 'Sepia', 0, 1, 0.01, 0, '%', (v) => {
    filter.sepia = v
    applyFilter()
  }, 'filterSepia')

  createSliderRow(filterBody, 'Hue Rot', 0, 360, 1, 0, '°', (v) => {
    filter.hueRotate = v
    applyFilter()
  }, 'filterHueRotate')

  createSliderRow(filterBody, 'Invert', 0, 1, 0.01, 0, '%', (v) => {
    filter.invert = v
    applyFilter()
  }, 'filterInvert')

  createSliderRow(filterBody, 'Saturate', 0, 2, 0.01, 1, '%', (v) => {
    filter.saturate = v
    applyFilter()
  }, 'filterSaturate')

  // ── Apply functions ──

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
    const str = stringifyBoxShadow([shadow])
    engine.applyStyle(target, { 'box-shadow': str })
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
    const str = buildFilterString(filter, FILTER_DEFAULTS)
    engine.applyStyle(target, { filter: str })
    onUpdate?.()
  }

  // ── Read state from element ──

  function readFromElement(element: HTMLElement) {
    const computed = getComputedStyle(element)

    // Opacity
    opacity = Math.round(parseFloat(computed.opacity) * 100)
    updateSlider('opacity', opacity)

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
    updateSlider('shadowX', shadow.offsetX)
    updateSlider('shadowY', shadow.offsetY)
    updateSlider('shadowBlur', shadow.blur)
    updateSlider('shadowSpread', shadow.spread)
    insetCheckbox.checked = shadow.inset

    // Try to set color swatch from shadow color
    try {
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.fillStyle = shadow.color
        colorSwatch.value = ctx.fillStyle.startsWith('#') ? ctx.fillStyle : '#000000'
      }
    } catch {
      colorSwatch.value = '#000000'
    }

    // Backdrop filter
    const bdFilter = computed.getPropertyValue('backdrop-filter') || computed.getPropertyValue('-webkit-backdrop-filter') || 'none'
    backdrop = parseFilterString(bdFilter, BACKDROP_DEFAULTS)
    updateSlider('backdropBlur', backdrop.blur)
    updateSlider('backdropBrightness', backdrop.brightness)
    updateSlider('backdropContrast', backdrop.contrast)
    updateSlider('backdropSaturate', backdrop.saturate)

    // Filter
    const flt = computed.filter || 'none'
    filter = parseFilterString(flt, FILTER_DEFAULTS)
    updateSlider('filterBlur', filter.blur)
    updateSlider('filterBrightness', filter.brightness)
    updateSlider('filterContrast', filter.contrast)
    updateSlider('filterGrayscale', filter.grayscale)
    updateSlider('filterSepia', filter.sepia)
    updateSlider('filterHueRotate', filter.hueRotate)
    updateSlider('filterInvert', filter.invert)
    updateSlider('filterSaturate', filter.saturate)

    // Collapse sections with all-default values
    const hasNonDefaultShadow = shadows.length > 0 && (
      shadow.offsetX !== 0 || shadow.offsetY !== 0 || shadow.blur !== 0 || shadow.spread !== 0
    )
    const hasNonDefaultBackdrop = Object.keys(BACKDROP_DEFAULTS).some(k => backdrop[k] !== BACKDROP_DEFAULTS[k])
    const hasNonDefaultFilter = Object.keys(FILTER_DEFAULTS).some(k => filter[k] !== FILTER_DEFAULTS[k])

    shadowSection.classList.toggle('collapsed', !hasNonDefaultShadow)
    backdropSection.classList.toggle('collapsed', !hasNonDefaultBackdrop)
    filterSection.classList.toggle('collapsed', !hasNonDefaultFilter)
  }

  function updateSlider(id: string, value: number) {
    const ref = sliderRefs[id]
    if (!ref) return
    ref.slider.value = String(value)
    // Determine unit from the slider context
    const unit = getUnitForSlider(id)
    ref.valueEl.textContent = formatValue(value, unit)
  }

  function getUnitForSlider(id: string): string {
    if (id === 'opacity') return '%'
    if (id.includes('Blur')) return 'px'
    if (id.includes('HueRotate') || id === 'filterHueRotate') return '°'
    if (id.startsWith('shadow')) return 'px'
    return '%'
  }

  // ── Positioning ──

  function positionNearElement() {
    if (!target) return
    const rect = target.getBoundingClientRect()
    const pickerW = 280
    const pickerH = container.offsetHeight || 400

    let left = rect.right + PICKER_MARGIN
    let top = rect.top

    if (left + pickerW > window.innerWidth - PICKER_MARGIN) {
      left = rect.left - pickerW - PICKER_MARGIN
    }
    left = Math.max(PICKER_MARGIN, Math.min(left, window.innerWidth - pickerW - PICKER_MARGIN))

    if (top + pickerH > window.innerHeight - PICKER_MARGIN) {
      top = window.innerHeight - pickerH - PICKER_MARGIN
    }
    top = Math.max(PICKER_MARGIN, top)

    container.style.left = `${left}px`
    container.style.top = `${top}px`
  }

  // ── Scroll/resize tracking ──

  function onScrollOrResize() {
    positionNearElement()
  }

  // ── Public API ──

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
