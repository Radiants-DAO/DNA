/**
 * Color Tool — Design Sub-Mode 5 (Semantic Color Picker)
 *
 * Floating popover near the selected element displaying the page's
 * brand palette tokens as colored dots in a circular layout.
 * Auto-maps the user's color choice to the correct semantic CSS variable
 * based on context (Text / Fill / Border).
 *
 * Tabs: Text | Fill | Border — cycle with [ ] keys
 * Opacity: vertical slider (0-100)
 * Blend mode: dropdown below tabs
 *
 * Uses the unified mutation engine for undo/redo support.
 *
 * Reference: positionTool.ts for the tool factory pattern
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { extractCustomProperties } from '../../../agent/customProperties'
import {
  extractBrandColors,
  getSemanticTarget,
  findSemanticVariable,
  countColorPrevalence,
  hexToHue,
  type ColorToken,
  type ColorTab,
} from './colorTokens'
import styles from './colorTool.css?inline'

// ── Types ──

export interface ColorToolOptions {
  /** Shadow root for rendering the color picker overlay */
  shadowRoot: ShadowRoot
  /** Unified mutation engine for applying changes */
  engine: UnifiedMutationEngine
  /** Called when the tool produces a visual update */
  onUpdate?: () => void
}

export interface ColorTool {
  /** Attach the tool to a target element */
  attach: (element: HTMLElement) => void
  /** Detach from the current element */
  detach: () => void
  /** Clean up all resources */
  destroy: () => void
}

// ── Constants ──

const TABS: readonly ColorTab[] = ['text', 'fill', 'border'] as const
const TAB_LABELS: Record<ColorTab, string> = {
  text: 'Text',
  fill: 'Fill',
  border: 'Border',
}
const PICKER_MARGIN = 8

// ── Tool Implementation ──

export function createColorTool(options: ColorToolOptions): ColorTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null
  let brandColors: ColorToken[] = []
  let activeTab: ColorTab = 'fill'
  let selectedBrandName: string | null = null
  let currentOpacity = 100

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-color-picker'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // Tab bar
  const tabBar = document.createElement('div')
  tabBar.className = 'flow-color-tabs'
  container.appendChild(tabBar)

  const tabButtons: Record<ColorTab, HTMLButtonElement> = {} as any
  for (const tab of TABS) {
    const btn = document.createElement('button')
    btn.className = 'flow-color-tab'
    btn.textContent = TAB_LABELS[tab]
    btn.addEventListener('click', () => setActiveTab(tab))
    tabBar.appendChild(btn)
    tabButtons[tab] = btn
  }

  // Palette + opacity wrapper
  const paletteWrap = document.createElement('div')
  paletteWrap.className = 'flow-color-palette-wrap'
  container.appendChild(paletteWrap)

  // Circular palette area
  const paletteArea = document.createElement('div')
  paletteArea.className = 'flow-color-palette'
  paletteWrap.appendChild(paletteArea)

  // Opacity slider (vertical)
  const opacityWrap = document.createElement('div')
  opacityWrap.className = 'flow-color-opacity'
  const opacityLabel = document.createElement('label')
  opacityLabel.textContent = 'α'
  opacityWrap.appendChild(opacityLabel)
  const opacitySlider = document.createElement('input')
  opacitySlider.type = 'range'
  opacitySlider.min = '0'
  opacitySlider.max = '100'
  opacitySlider.value = '100'
  opacitySlider.addEventListener('input', () => {
    currentOpacity = Number(opacitySlider.value)
    opacityValue.textContent = `${currentOpacity}`
    applyAlpha()
  })
  opacityWrap.appendChild(opacitySlider)
  const opacityValue = document.createElement('span')
  opacityValue.className = 'flow-opacity-value'
  opacityValue.textContent = '100'
  opacityWrap.appendChild(opacityValue)
  paletteWrap.appendChild(opacityWrap)

  // Token label
  const tokenLabel = document.createElement('div')
  tokenLabel.className = 'flow-color-label'
  tokenLabel.innerHTML = '<span class="token-name">No token selected</span>'
  container.appendChild(tokenLabel)

  // ── State helpers ──

  function setActiveTab(tab: ColorTab) {
    activeTab = tab
    for (const t of TABS) {
      tabButtons[t].classList.toggle('active', t === tab)
    }
    // Update selected dot and alpha based on element's current value for this tab
    preselectFromElement()
    if (target) {
      const mapping = getSemanticTarget(tab)
      const computed = getComputedStyle(target)
      currentOpacity = extractAlpha(computed.getPropertyValue(mapping.property))
      opacitySlider.value = `${currentOpacity}`
      opacityValue.textContent = `${currentOpacity}`
    }
  }

  function cycleTab(direction: 1 | -1) {
    const idx = TABS.indexOf(activeTab)
    const next = (idx + direction + TABS.length) % TABS.length
    setActiveTab(TABS[next])
  }

  // ── Palette rendering (concentric ring layout) ──

  function populatePalette() {
    paletteArea.innerHTML = ''
    if (brandColors.length === 0) {
      paletteArea.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-size:10px;">No color tokens found</div>'
      return
    }

    const containerSize = 180
    const centerX = containerSize / 2
    const centerY = containerSize / 2
    const dotRadius = 10 // half of 20px dot

    // Count prevalence and split into outer (high) / inner (low) rings
    const prevalence = countColorPrevalence(brandColors)
    const sorted = [...brandColors].sort(
      (a, b) => (prevalence.get(b.resolvedHex) ?? 0) - (prevalence.get(a.resolvedHex) ?? 0),
    )

    // Split: top half by prevalence → outer ring, bottom half → inner ring
    const splitIdx = Math.ceil(sorted.length / 2)
    const outerTokens = sorted.slice(0, splitIdx)
    const innerTokens = sorted.slice(splitIdx)

    // Sort each ring by hue for visual coherence
    outerTokens.sort((a, b) => hexToHue(a.resolvedHex) - hexToHue(b.resolvedHex))
    innerTokens.sort((a, b) => hexToHue(a.resolvedHex) - hexToHue(b.resolvedHex))

    const outerRadius = (containerSize / 2) - dotRadius - 4
    const innerRadius = outerTokens.length > 0 ? outerRadius * 0.55 : outerRadius

    function placeRing(tokens: ColorToken[], radius: number) {
      const count = tokens.length
      if (count === 0) return
      for (let i = 0; i < count; i++) {
        const color = tokens[i]
        const angle = (2 * Math.PI * i) / count - Math.PI / 2
        const x = centerX + radius * Math.cos(angle) - dotRadius
        const y = centerY + radius * Math.sin(angle) - dotRadius

        const dot = document.createElement('div')
        dot.className = 'flow-color-dot'
        dot.dataset.token = color.name
        dot.style.backgroundColor = color.resolvedHex
        dot.style.left = `${x}px`
        dot.style.top = `${y}px`
        dot.title = color.name.replace(/^--/, '')

        const usage = prevalence.get(color.resolvedHex) ?? 0
        if (usage > 0) dot.title += ` (${usage})`

        dot.addEventListener('click', () => selectColor(color))
        paletteArea.appendChild(dot)
      }
    }

    placeRing(outerTokens, outerRadius)
    placeRing(innerTokens, innerRadius)
  }

  function updateDotSelection() {
    const dots = paletteArea.querySelectorAll('.flow-color-dot')
    dots.forEach((dot) => {
      const el = dot as HTMLElement
      el.classList.toggle('selected', el.dataset.token === selectedBrandName)
    })
  }

  // ── Color selection ──

  function selectColor(color: ColorToken) {
    if (!target) return

    selectedBrandName = color.name
    updateDotSelection()

    const mapping = getSemanticTarget(activeTab)
    const allTokens = extractCustomProperties(target)

    // Try to find a semantic variable matching this brand color
    const semanticVar = findSemanticVariable(color.name, mapping.prefix, allTokens, target)
    const varToUse = semanticVar || color.name
    const varExpression = `var(${varToUse})`

    engine.applyStyle(target, { [mapping.property]: varExpression })

    // Update label
    const displayName = varToUse.replace(/^--/, '')
    tokenLabel.innerHTML = `<span class="token-name">${displayName}</span>`

    onUpdate?.()
  }

  function preselectFromElement() {
    if (!target) return
    const mapping = getSemanticTarget(activeTab)
    const computed = getComputedStyle(target)
    const currentValue = computed.getPropertyValue(mapping.property).trim()

    // Try to find which brand color matches the current value
    selectedBrandName = null
    for (const color of brandColors) {
      if (color.resolvedHex === resolveColorToHex(currentValue)) {
        selectedBrandName = color.name
        break
      }
    }
    updateDotSelection()

    if (selectedBrandName) {
      tokenLabel.innerHTML = `<span class="token-name">${selectedBrandName.replace(/^--/, '')}</span>`
    } else {
      tokenLabel.innerHTML = '<span class="token-name">No token selected</span>'
    }
  }

  function resolveColorToHex(cssColor: string): string {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return cssColor
    ctx.fillStyle = cssColor
    return ctx.fillStyle
  }

  // ── Tab auto-detection ──

  const TEXT_TAGS = new Set([
    'P', 'SPAN', 'A', 'STRONG', 'EM', 'B', 'I', 'U', 'S',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'LABEL', 'SMALL', 'SUB', 'SUP', 'CODE', 'PRE', 'BLOCKQUOTE',
    'LI', 'DT', 'DD', 'FIGCAPTION', 'CITE', 'ABBR', 'TIME',
  ])

  function detectInitialTab(el: HTMLElement, computed: CSSStyleDeclaration): ColorTab {
    // If it has a visible border, start on border tab
    const bw = parseFloat(computed.borderWidth) || 0
    const borderVisible = bw > 0 && computed.borderStyle !== 'none'

    // If it's a text-oriented element with no significant background
    const isTextEl = TEXT_TAGS.has(el.tagName)
    const bgColor = computed.backgroundColor
    const bgTransparent = bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)'

    if (isTextEl && bgTransparent && !borderVisible) return 'text'
    if (borderVisible && bgTransparent) return 'border'
    return 'fill'
  }

  // ── Alpha helpers ──

  /**
   * Extract alpha (0-100) from a CSS color value.
   * Handles rgba(..., 0.5), hex with alpha, etc.
   */
  function extractAlpha(cssColor: string): number {
    const trimmed = cssColor.trim()
    // rgba(r, g, b, a) or rgba(r g b / a)
    const rgbaMatch = trimmed.match(/rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+[\s,/]+\s*([\d.]+)\s*\)/)
    if (rgbaMatch) return Math.round(parseFloat(rgbaMatch[1]) * 100)
    // Default: fully opaque
    return 100
  }

  /**
   * Apply alpha to the current color property by wrapping in rgba via color-mix.
   * Uses color-mix(in srgb, <current-color> <alpha>%, transparent) so it works
   * with both var() references and raw colors.
   */
  function applyAlpha() {
    if (!target) return
    const mapping = getSemanticTarget(activeTab)
    const computed = getComputedStyle(target)
    const currentColor = computed.getPropertyValue(mapping.property).trim()

    if (currentOpacity >= 100) {
      // Full alpha — use the color as-is (no wrapping needed)
      // Only re-apply if we have a selected token
      if (selectedBrandName) {
        const allTokens = extractCustomProperties(target)
        const semanticVar = findSemanticVariable(selectedBrandName, mapping.prefix, allTokens, target)
        const varToUse = semanticVar || selectedBrandName
        engine.applyStyle(target, { [mapping.property]: `var(${varToUse})` })
      }
    } else {
      // Apply alpha via color-mix
      // Resolve the base color (without alpha) from what's currently set
      const baseColor = selectedBrandName ? `var(${selectedBrandName})` : currentColor
      const withAlpha = `color-mix(in srgb, ${baseColor} ${currentOpacity}%, transparent)`
      engine.applyStyle(target, { [mapping.property]: withAlpha })
    }
    onUpdate?.()
  }

  // ── Positioning ──

  function positionNearElement() {
    if (!target) return
    const rect = target.getBoundingClientRect()
    const pickerW = 240
    const pickerH = container.offsetHeight || 280

    let left = rect.right + PICKER_MARGIN
    let top = rect.top

    // Flip left if it would overflow right
    if (left + pickerW > window.innerWidth - PICKER_MARGIN) {
      left = rect.left - pickerW - PICKER_MARGIN
    }
    // Clamp left
    left = Math.max(PICKER_MARGIN, Math.min(left, window.innerWidth - pickerW - PICKER_MARGIN))

    // Shift up if it would overflow bottom
    if (top + pickerH > window.innerHeight - PICKER_MARGIN) {
      top = window.innerHeight - pickerH - PICKER_MARGIN
    }
    // Clamp top
    top = Math.max(PICKER_MARGIN, top)

    container.style.left = `${left}px`
    container.style.top = `${top}px`
  }

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return

    if (e.key === '[') {
      e.preventDefault()
      e.stopPropagation()
      cycleTab(-1)
      return
    }
    if (e.key === ']') {
      e.preventDefault()
      e.stopPropagation()
      cycleTab(1)
      return
    }
  }

  // ── Scroll/resize tracking ──

  function onScrollOrResize() {
    positionNearElement()
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element

      // Extract brand colors from the element context
      brandColors = extractBrandColors(element)

      const computed = getComputedStyle(element)

      // Auto-detect initial tab from element context
      const detectedTab = detectInitialTab(element, computed)

      // Read current alpha from the active color property
      const mapping = getSemanticTarget(detectedTab)
      currentOpacity = extractAlpha(computed.getPropertyValue(mapping.property))
      opacitySlider.value = `${currentOpacity}`
      opacityValue.textContent = `${currentOpacity}`

      // Set default tab and update UI
      setActiveTab(detectedTab)

      // Show and position
      container.style.display = ''
      populatePalette()
      positionNearElement()

      // Pre-select matching dot
      preselectFromElement()

      // Register listeners
      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      brandColors = []
      selectedBrandName = null
      container.style.display = 'none'
      paletteArea.innerHTML = ''
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
