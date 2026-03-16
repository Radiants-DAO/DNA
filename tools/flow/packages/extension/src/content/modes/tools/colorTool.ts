/**
 * Color Tool — Design Sub-Mode 4 (Variable List Picker)
 *
 * Webflow-style floating panel displaying the page's color tokens
 * as a searchable, grouped list with swatches.
 *
 * Tabs: Text | Fill | Border — cycle with [ ] keys
 * Search: filters tokens by name or value
 * Groups: auto-grouped by token prefix (surface, content, edge, brand, etc.)
 * Opacity: floating horizontal bar below the panel
 *
 * Uses the unified mutation engine for undo/redo support.
 */

import type { UnifiedMutationEngine } from '../../mutations/unifiedMutationEngine'
import { extractCustomProperties } from '../../../agent/customProperties'
import {
  extractBrandColors,
  getSemanticTarget,
  findSemanticVariable,
  type ColorToken,
  type ColorTab,
} from './colorTokens'
import { createToolPanelHeader } from './toolPanelHeader'
import styles from './colorTool.css?inline'
import { shouldIgnoreKeyboardShortcut } from '../../features/keyboardGuards'

// ── Types ──

export interface ColorToolOptions {
  shadowRoot: ShadowRoot
  engine: UnifiedMutationEngine
  onUpdate?: () => void
}

export interface ColorTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

interface ColorGroup {
  label: string
  tokens: ColorToken[]
}

// ── Constants ──

const TABS: readonly ColorTab[] = ['text', 'fill', 'border'] as const
const TAB_LABELS: Record<ColorTab, string> = {
  text: 'Text',
  fill: 'Fill',
  border: 'Border',
}
import { computeToolPanelPosition } from './toolPanelPosition'

const PICKER_MARGIN = 8

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>'

// ── Helpers ──

/**
 * Group tokens by the first segment after `--color-`.
 * e.g. `--color-page` → group "surface"
 *      `--color-brand-red`       → group "brand"
 */
function groupTokens(tokens: ColorToken[]): ColorGroup[] {
  const map = new Map<string, ColorToken[]>()

  for (const token of tokens) {
    const stripped = token.name.replace(/^--color-/, '')
    const dashIdx = stripped.indexOf('-')
    const groupKey = dashIdx > 0 ? stripped.slice(0, dashIdx) : 'other'
    let list = map.get(groupKey)
    if (!list) {
      list = []
      map.set(groupKey, list)
    }
    list.push(token)
  }

  return [...map.entries()].map(([label, groupTokens]) => ({ label, tokens: groupTokens }))
}

/**
 * Format a token name for display.
 * Strips `--color-` prefix and replaces dashes with spaces.
 */
function displayName(tokenName: string): string {
  return tokenName.replace(/^--color-/, '').replace(/-/g, ' ')
}

/**
 * Format a color value for display (short form).
 */
function displayValue(token: ColorToken): string {
  if (token.resolvedHex.startsWith('#')) return token.resolvedHex
  // For rgba/etc values, truncate
  const v = token.value || token.resolvedHex
  return v.length > 18 ? v.slice(0, 16) + '\u2026' : v
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
  const bw = parseFloat(computed.borderWidth) || 0
  const borderVisible = bw > 0 && computed.borderStyle !== 'none'
  const isTextEl = TEXT_TAGS.has(el.tagName)
  const bgColor = computed.backgroundColor
  const bgTransparent = bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)'

  if (isTextEl && bgTransparent && !borderVisible) return 'text'
  if (borderVisible && bgTransparent) return 'border'
  return 'fill'
}

// ── Alpha helpers ──

function extractAlpha(cssColor: string): number {
  const trimmed = cssColor.trim()
  const rgbaMatch = trimmed.match(/rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+[\s,/]+\s*([\d.]+)\s*\)/)
  if (rgbaMatch) return Math.round(parseFloat(rgbaMatch[1]) * 100)
  return 100
}

// ── Tool Implementation ──

export function createColorTool(options: ColorToolOptions): ColorTool {
  const { shadowRoot, engine, onUpdate } = options

  let target: HTMLElement | null = null
  let allTokens: ColorToken[] = []
  let activeTab: ColorTab = 'fill'
  let selectedBrandName: string | null = null
  let currentOpacity = 100
  let searchQuery = ''

  // ── Inject styles ──

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // ── Build DOM ──

  const container = document.createElement('div')
  container.className = 'flow-color-picker'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  // ── Panel Header (shared sub-mode switcher) ──

  const toolHeader = createToolPanelHeader({
    shadowRoot,
    currentModeId: 'color',
  })
  container.appendChild(toolHeader.header)

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

  // Search box
  const searchBox = document.createElement('div')
  searchBox.className = 'flow-color-search'

  const searchIcon = document.createElement('span')
  searchIcon.className = 'flow-color-search-icon'
  searchIcon.innerHTML = SEARCH_ICON
  searchBox.appendChild(searchIcon)

  const searchInput = document.createElement('input')
  searchInput.className = 'flow-color-search-input'
  searchInput.type = 'text'
  searchInput.placeholder = 'Search variables\u2026'
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase()
    renderList()
  })
  searchInput.addEventListener('keydown', (e) => {
    e.stopPropagation() // prevent arrow keys / escape from bubbling
  })
  searchBox.appendChild(searchInput)

  container.appendChild(searchBox)

  // Scrollable list
  const listEl = document.createElement('div')
  listEl.className = 'flow-color-list'
  container.appendChild(listEl)

  // Token label (bottom)
  const tokenLabel = document.createElement('div')
  tokenLabel.className = 'flow-color-label'
  tokenLabel.innerHTML = '<span class="token-name">No token selected</span>'
  container.appendChild(tokenLabel)

  // ── Floating Opacity Bar ──

  const opacityBar = document.createElement('div')
  opacityBar.className = 'flow-color-opacity-bar'
  opacityBar.style.display = 'none'

  const opLabel = document.createElement('span')
  opLabel.className = 'flow-color-opacity-label'
  opLabel.textContent = '\u03b1'
  opacityBar.appendChild(opLabel)

  const opSlider = document.createElement('input')
  opSlider.className = 'flow-color-opacity-slider'
  opSlider.type = 'range'
  opSlider.min = '0'
  opSlider.max = '100'
  opSlider.value = '100'
  opSlider.addEventListener('input', () => {
    currentOpacity = Number(opSlider.value)
    opValue.textContent = `${currentOpacity}`
    applyAlpha()
  })
  opacityBar.appendChild(opSlider)

  const opValue = document.createElement('span')
  opValue.className = 'flow-color-opacity-value'
  opValue.textContent = '100'
  opacityBar.appendChild(opValue)

  shadowRoot.appendChild(opacityBar)

  // ══════════════════════════════════════════════════════════
  // TABS
  // ══════════════════════════════════════════════════════════

  function setActiveTab(tab: ColorTab) {
    activeTab = tab
    for (const t of TABS) {
      tabButtons[t].classList.toggle('active', t === tab)
    }
    preselectFromElement()
    if (target) {
      const mapping = getSemanticTarget(tab)
      const computed = getComputedStyle(target)
      currentOpacity = extractAlpha(computed.getPropertyValue(mapping.property))
      opSlider.value = `${currentOpacity}`
      opValue.textContent = `${currentOpacity}`
    }
  }

  function cycleTab(direction: 1 | -1) {
    const idx = TABS.indexOf(activeTab)
    const next = (idx + direction + TABS.length) % TABS.length
    setActiveTab(TABS[next])
  }

  // ══════════════════════════════════════════════════════════
  // LIST RENDERING
  // ══════════════════════════════════════════════════════════

  function renderList() {
    listEl.innerHTML = ''

    // Filter tokens by search query
    let filtered = allTokens
    if (searchQuery) {
      filtered = allTokens.filter((t) => {
        const name = t.name.toLowerCase()
        const val = (t.value || t.resolvedHex).toLowerCase()
        return name.includes(searchQuery) || val.includes(searchQuery)
      })
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'flow-color-empty'
      empty.textContent = searchQuery ? 'No matching tokens' : 'No color tokens found'
      listEl.appendChild(empty)
      return
    }

    const groups = groupTokens(filtered)

    for (const group of groups) {
      const groupEl = document.createElement('div')
      groupEl.className = 'flow-color-group'

      // Group header
      const header = document.createElement('div')
      header.className = 'flow-color-group-header'

      const chevron = document.createElement('span')
      chevron.className = 'flow-color-group-chevron'
      chevron.textContent = '\u25be'
      header.appendChild(chevron)

      const title = document.createElement('span')
      title.className = 'flow-color-group-title'
      title.textContent = group.label
      header.appendChild(title)

      header.addEventListener('click', () => {
        groupEl.classList.toggle('collapsed')
      })
      groupEl.appendChild(header)

      // Group body
      const body = document.createElement('div')
      body.className = 'flow-color-group-body'

      for (const token of group.tokens) {
        const item = document.createElement('div')
        item.className = 'flow-color-item'
        if (token.name === selectedBrandName) item.classList.add('selected')
        item.dataset.token = token.name

        const swatch = document.createElement('div')
        swatch.className = 'flow-color-swatch'
        swatch.style.backgroundColor = token.resolvedHex
        item.appendChild(swatch)

        const name = document.createElement('span')
        name.className = 'flow-color-item-name'
        name.textContent = displayName(token.name)
        name.title = token.name
        item.appendChild(name)

        const value = document.createElement('span')
        value.className = 'flow-color-item-value'
        value.textContent = displayValue(token)
        item.appendChild(value)

        item.addEventListener('click', () => selectColor(token))
        body.appendChild(item)
      }

      groupEl.appendChild(body)
      listEl.appendChild(groupEl)
    }
  }

  function updateItemSelection() {
    const items = listEl.querySelectorAll('.flow-color-item')
    items.forEach((item) => {
      const el = item as HTMLElement
      el.classList.toggle('selected', el.dataset.token === selectedBrandName)
    })
  }

  // ══════════════════════════════════════════════════════════
  // COLOR SELECTION
  // ══════════════════════════════════════════════════════════

  function selectColor(color: ColorToken) {
    if (!target) return

    selectedBrandName = color.name
    updateItemSelection()

    const mapping = getSemanticTarget(activeTab)
    const allElTokens = extractCustomProperties(target)
    const semanticVar = findSemanticVariable(color.name, mapping.prefix, allElTokens, target)
    const varToUse = semanticVar || color.name
    const varExpression = `var(${varToUse})`

    engine.applyStyle(target, { [mapping.property]: varExpression })

    const label = varToUse.replace(/^--/, '')
    tokenLabel.innerHTML = `<span class="token-name">${label}</span>`

    onUpdate?.()
  }

  function preselectFromElement() {
    if (!target) return
    const mapping = getSemanticTarget(activeTab)
    const computed = getComputedStyle(target)
    const currentValue = computed.getPropertyValue(mapping.property).trim()

    selectedBrandName = null
    for (const color of allTokens) {
      if (color.resolvedHex === resolveColorToHex(currentValue)) {
        selectedBrandName = color.name
        break
      }
    }
    updateItemSelection()

    if (selectedBrandName) {
      tokenLabel.innerHTML = `<span class="token-name">${selectedBrandName.replace(/^--/, '')}</span>`
    } else {
      tokenLabel.innerHTML = '<span class="token-name">No token selected</span>'
    }
  }

  // ══════════════════════════════════════════════════════════
  // OPACITY
  // ══════════════════════════════════════════════════════════

  function applyAlpha() {
    if (!target) return
    const mapping = getSemanticTarget(activeTab)
    const computed = getComputedStyle(target)
    const currentColor = computed.getPropertyValue(mapping.property).trim()

    if (currentOpacity >= 100) {
      if (selectedBrandName) {
        const allElTokens = extractCustomProperties(target)
        const semanticVar = findSemanticVariable(selectedBrandName, mapping.prefix, allElTokens, target)
        const varToUse = semanticVar || selectedBrandName
        engine.applyStyle(target, { [mapping.property]: `var(${varToUse})` })
      }
    } else {
      const baseColor = selectedBrandName ? `var(${selectedBrandName})` : currentColor
      const withAlpha = `color-mix(in srgb, ${baseColor} ${currentOpacity}%, transparent)`
      engine.applyStyle(target, { [mapping.property]: withAlpha })
    }
    onUpdate?.()
  }

  // ══════════════════════════════════════════════════════════
  // POSITIONING
  // ══════════════════════════════════════════════════════════

  function positionNearElement() {
    if (!target) return
    const pos = computeToolPanelPosition(target, 260, container.offsetHeight || 400)
    container.style.left = `${pos.left}px`
    container.style.top = `${pos.top}px`

    // Position opacity bar below the panel
    const containerRect = container.getBoundingClientRect()
    opacityBar.style.left = `${containerRect.left}px`
    opacityBar.style.top = `${containerRect.bottom + 6}px`
    opacityBar.style.width = `260px`
  }

  // ── Keyboard handler ──

  function onKeyDown(e: KeyboardEvent) {
    if (!target) return
    if (shouldIgnoreKeyboardShortcut(e)) return
    if (e.key === '[') {
      e.preventDefault()
      e.stopPropagation()
      cycleTab(-1)
    } else if (e.key === ']') {
      e.preventDefault()
      e.stopPropagation()
      cycleTab(1)
    }
  }

  function onScrollOrResize() {
    positionNearElement()
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      allTokens = extractBrandColors(element)

      const computed = getComputedStyle(element)
      const detectedTab = detectInitialTab(element, computed)
      const mapping = getSemanticTarget(detectedTab)
      currentOpacity = extractAlpha(computed.getPropertyValue(mapping.property))
      opSlider.value = `${currentOpacity}`
      opValue.textContent = `${currentOpacity}`

      setActiveTab(detectedTab)

      // Reset search
      searchQuery = ''
      searchInput.value = ''

      // Show and render
      container.style.display = ''
      opacityBar.style.display = ''
      renderList()
      positionNearElement()
      preselectFromElement()

      document.addEventListener('keydown', onKeyDown)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      allTokens = []
      selectedBrandName = null
      searchQuery = ''
      searchInput.value = ''
      container.style.display = 'none'
      opacityBar.style.display = 'none'
      listEl.innerHTML = ''
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      target = null
      toolHeader.destroy()
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      container.remove()
      opacityBar.remove()
      styleEl.remove()
    },
  }
}
