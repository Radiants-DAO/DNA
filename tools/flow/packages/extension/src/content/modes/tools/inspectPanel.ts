import { computeToolPanelPosition } from './toolPanelPosition'
import { scanElementAssets, scanMultipleElements, type ElementAssets } from './assetScanner'
import { getPersistentSelectionSelectors } from '../../overlays/persistentSelections'
import styles from './inspectPanel.css?inline'

// ── Icons (inline SVG) ──

const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'

// ── Types ──

// NOTE: No engine needed — Inspect mode is read-only (no mutations).
export interface InspectPanelOptions {
  shadowRoot: ShadowRoot
}

export interface InspectPanel {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

type TopTab = 'assets' | 'styles' | 'a11y'
type AssetSubTab = 'images' | 'svgs' | 'fonts' | 'colors' | 'variables'

const ASSET_TAB_LABELS: Record<AssetSubTab, string> = {
  images: 'Images',
  svgs: 'SVGs',
  fonts: 'Fonts',
  colors: 'Colors',
  variables: 'Variables',
}

const TOP_TAB_LABELS: Record<TopTab, string> = {
  assets: 'Assets',
  styles: 'Styles',
  a11y: 'A11y',
}

// ── Factory ──

export function createInspectPanel({ shadowRoot }: InspectPanelOptions): InspectPanel {

  // Inject CSS
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // Build DOM
  const container = document.createElement('div')
  container.className = 'flow-asset-panel'
  container.style.display = 'none'
  shadowRoot.appendChild(container)

  const header = document.createElement('div')
  header.className = 'flow-asset-header'
  container.appendChild(header)

  // Top-level tabs: Assets | Styles | A11y
  const topTabBar = document.createElement('div')
  topTabBar.className = 'flow-inspect-top-tabs'
  container.appendChild(topTabBar)

  // Sub-tab bar (for Assets tab only)
  const tabBar = document.createElement('div')
  tabBar.className = 'flow-asset-tabs'
  container.appendChild(tabBar)

  const list = document.createElement('div')
  list.className = 'flow-asset-list'
  container.appendChild(list)

  const toast = document.createElement('div')
  toast.className = 'flow-asset-toast'
  toast.textContent = 'Copied!'
  container.appendChild(toast)

  // State
  let target: HTMLElement | null = null
  let assets: ElementAssets = { images: [], svgs: [], fonts: [], colors: [], variables: [] }
  let activeTopTab: TopTab = 'assets'
  let activeTab: AssetSubTab = 'images'
  let focusedIndex = -1
  const itemCopyCallbacks: (() => void)[] = []

  // ── Top-level tab rendering ──

  function renderTopTabs(): void {
    topTabBar.innerHTML = ''
    const tabs: TopTab[] = ['assets', 'styles', 'a11y']
    for (const tabId of tabs) {
      const tab = document.createElement('div')
      tab.className = `flow-inspect-top-tab${tabId === activeTopTab ? ' active' : ''}`
      tab.textContent = TOP_TAB_LABELS[tabId]
      tab.addEventListener('click', () => {
        activeTopTab = tabId
        renderTopTabs()
        renderContent()
      })
      topTabBar.appendChild(tab)
    }
  }

  function renderContent(): void {
    // Show/hide sub-tab bar based on top tab
    tabBar.style.display = activeTopTab === 'assets' ? '' : 'none'

    switch (activeTopTab) {
      case 'assets':
        renderTabs()
        renderList()
        break
      case 'styles':
        renderStylesTab()
        break
      case 'a11y':
        renderA11yTab()
        break
    }
  }

  // Placeholder — will be implemented in Task 4
  function renderStylesTab(): void {
    list.innerHTML = ''
    itemCopyCallbacks.length = 0
    focusedIndex = -1
    const empty = document.createElement('div')
    empty.className = 'flow-asset-empty'
    empty.textContent = 'Styles tab — coming in next task'
    list.appendChild(empty)
  }

  // Placeholder — will be implemented in Task 5
  function renderA11yTab(): void {
    list.innerHTML = ''
    itemCopyCallbacks.length = 0
    focusedIndex = -1
    const empty = document.createElement('div')
    empty.className = 'flow-asset-empty'
    empty.textContent = 'A11y tab — coming in next task'
    list.appendChild(empty)
  }

  // ── Asset sub-tab rendering ──

  function renderTabs(): void {
    tabBar.innerHTML = ''
    const allTabs: AssetSubTab[] = ['images', 'svgs', 'fonts', 'colors', 'variables']
    const counts: Record<AssetSubTab, number> = {
      images: assets.images.length,
      svgs: assets.svgs.length,
      fonts: assets.fonts.length,
      colors: assets.colors.length,
      variables: assets.variables.length,
    }

    // Only show tabs that have items
    const visibleTabs = allTabs.filter(t => counts[t] > 0)

    // Auto-select first non-empty tab if current is empty/hidden
    if (counts[activeTab] === 0) {
      if (visibleTabs.length > 0) activeTab = visibleTabs[0]
    }

    for (const tabId of visibleTabs) {
      const tab = document.createElement('div')
      tab.className = `flow-asset-tab${tabId === activeTab ? ' active' : ''}`
      tab.innerHTML = `${ASSET_TAB_LABELS[tabId]}<span class="tab-count">${counts[tabId]}</span>`
      tab.addEventListener('click', () => {
        activeTab = tabId
        renderTabs()
        renderList()
      })
      tabBar.appendChild(tab)
    }
  }

  // ── List rendering ──

  function renderList(): void {
    list.innerHTML = ''
    itemCopyCallbacks.length = 0
    focusedIndex = -1

    switch (activeTab) {
      case 'images':
        if (assets.images.length === 0) return renderEmpty('No images found')
        for (const img of assets.images) {
          const item = createItem(
            () => {
              const preview = document.createElement('img')
              preview.src = img.src
              return preview
            },
            img.src.split('/').pop() || img.src,
            img.isBackground ? 'CSS background' : `${img.width}×${img.height}`,
            () => copyText(img.src),
            () => downloadUrl(img.src, img.src.split('/').pop() || 'image'),
          )
          list.appendChild(item)
        }
        break

      case 'svgs':
        if (assets.svgs.length === 0) return renderEmpty('No SVGs found')
        for (const svg of assets.svgs) {
          const item = createItem(
            () => {
              const wrapper = document.createElement('div')
              wrapper.innerHTML = svg.markup
              const inner = wrapper.querySelector('svg')
              if (inner) {
                inner.setAttribute('width', '20')
                inner.setAttribute('height', '20')
              }
              return wrapper
            },
            `SVG ${svg.width}×${svg.height}`,
            `${svg.markup.length} chars`,
            () => copyText(svg.markup),
            () => downloadBlob(svg.markup, 'image/svg+xml', 'icon.svg'),
          )
          list.appendChild(item)
        }
        break

      case 'fonts':
        if (assets.fonts.length === 0) return renderEmpty('No fonts found')
        for (const font of assets.fonts) {
          const item = createItem(
            () => {
              const preview = document.createElement('span')
              preview.className = 'font-preview'
              preview.style.fontFamily = font.family
              preview.textContent = 'Aa'
              return preview
            },
            font.family,
            `${font.weight} ${font.style}`,
            () => copyText(font.family),
            font.src ? () => downloadUrl(font.src!, font.family + '.woff2') : undefined,
          )
          list.appendChild(item)
        }
        break

      case 'colors':
        if (assets.colors.length === 0) return renderEmpty('No colors found')
        for (const c of assets.colors) {
          const item = createItem(
            () => {
              const preview = document.createElement('div')
              applySwatchStyles(preview, c.hex)
              return preview
            },
            c.hex,
            `${c.property} on ${c.source}`,
            () => copyText(c.hex),
          )
          list.appendChild(item)
        }
        break

      case 'variables':
        if (assets.variables.length === 0) return renderEmpty('No CSS variables found')
        for (const v of assets.variables) {
          const kind = classifyValue(v.name, v.value)
          const item = createItem(
            () => createVariablePreview(v.name, v.value, kind),
            v.name,
            v.value,
            () => copyText(`${v.name}: ${v.value}`),
            () => downloadBlob(`${v.name}: ${v.value};`, 'text/css', `${v.name}.css`),
          )
          list.appendChild(item)
        }
        break
    }
  }

  function renderEmpty(message: string): void {
    const empty = document.createElement('div')
    empty.className = 'flow-asset-empty'
    empty.textContent = message
    list.appendChild(empty)
  }

  // ── Item builder ──

  function createItem(
    previewFn: () => HTMLElement,
    name: string,
    meta: string,
    onCopy: () => void,
    onDownload?: () => void,
  ): HTMLElement {
    const item = document.createElement('div')
    item.className = 'flow-asset-item'
    itemCopyCallbacks.push(onCopy)

    const previewWrap = document.createElement('div')
    previewWrap.className = 'flow-asset-preview'
    previewWrap.appendChild(previewFn())
    item.appendChild(previewWrap)

    const info = document.createElement('div')
    info.className = 'flow-asset-info'
    const nameEl = document.createElement('div')
    nameEl.className = 'flow-asset-name'
    nameEl.textContent = name
    nameEl.title = name
    info.appendChild(nameEl)
    const metaEl = document.createElement('div')
    metaEl.className = 'flow-asset-meta'
    metaEl.textContent = meta
    metaEl.title = meta
    info.appendChild(metaEl)
    item.appendChild(info)

    const actions = document.createElement('div')
    actions.className = 'flow-asset-actions'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'flow-asset-action'
    copyBtn.innerHTML = ICON_COPY
    copyBtn.title = 'Copy'
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      onCopy()
      showToast()
    })
    actions.appendChild(copyBtn)

    if (onDownload) {
      const dlBtn = document.createElement('button')
      dlBtn.className = 'flow-asset-action'
      dlBtn.innerHTML = ICON_DOWNLOAD
      dlBtn.title = 'Download'
      dlBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        onDownload()
      })
      actions.appendChild(dlBtn)
    }

    item.appendChild(actions)
    return item
  }

  // ── Helpers ──

  // ── Value classification ──

  type VarKind = 'color' | 'shadow' | 'gradient' | 'length' | 'radius' | 'font' | 'easing' | 'duration' | 'other'

  function classifyValue(name: string, value: string): VarKind {
    const v = value.trim()
    if (/^(#|rgb|hsl|oklch|oklab|lch|lab|color\()/.test(v)) return 'color'
    if (/^(linear-gradient|radial-gradient|conic-gradient)/.test(v)) return 'gradient'
    if (/\d+px\s+\d+px/.test(v) && /rgba?\(|#/.test(v)) return 'shadow'
    if (/radius/i.test(name)) return 'radius'
    if (/font-size|font-family|font-weight/i.test(name)) return 'font'
    if (/cubic-bezier|ease|linear|step/i.test(v)) return 'easing'
    if (/^-?\d+(\.\d+)?(ms|s)$/.test(v)) return 'duration'
    if (/^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)$/.test(v)) return 'length'
    return 'other'
  }

  function kindLabel(kind: VarKind): string {
    switch (kind) {
      case 'easing': return 'ease'
      case 'duration': return 'time'
      case 'length': return 'size'
      case 'radius': return 'rad'
      case 'font': return 'font'
      default: return 'var'
    }
  }

  function createVariablePreview(name: string, value: string, kind: VarKind): HTMLElement {
    const preview = document.createElement('div')

    switch (kind) {
      case 'color':
        applySwatchStyles(preview, value)
        break

      case 'gradient':
        preview.style.cssText = `
          width:100%;height:100%;border-radius:4px;
          border:1.5px solid rgba(255,255,255,0.25);
          background:${value};
        `
        break

      case 'shadow': {
        preview.className = 'shadow-preview'
        const box = document.createElement('div')
        box.style.cssText = `width:18px;height:18px;border-radius:3px;background:var(--flow-tool-text,#e5e5e5);box-shadow:${value};`
        preview.appendChild(box)
        break
      }

      case 'radius': {
        preview.className = 'radius-preview'
        const box = document.createElement('div')
        box.style.cssText = `width:22px;height:22px;border:2px solid var(--flow-tool-accent,#3b82f6);border-radius:${value};`
        preview.appendChild(box)
        break
      }

      case 'length': {
        preview.className = 'length-preview'
        const parsed = parseFloat(value)
        const maxBar = 28
        const barW = Math.max(2, Math.min(maxBar, (parsed / 48) * maxBar))
        const bar = document.createElement('div')
        bar.style.cssText = `width:${barW}px;height:8px;border-radius:2px;background:var(--flow-tool-accent,#3b82f6);`
        preview.appendChild(bar)
        break
      }

      case 'font': {
        preview.className = 'font-preview'
        preview.textContent = 'Aa'
        if (/font-family/i.test(name)) {
          preview.style.fontFamily = value
        } else if (/font-weight/i.test(name)) {
          preview.style.fontWeight = value
        } else if (/font-size/i.test(name)) {
          const sz = parseFloat(value)
          preview.style.fontSize = `${Math.min(sz, 18)}px`
        }
        break
      }

      // Non-visual: easing, duration, other — show a type badge
      default:
        preview.className = 'type-badge'
        preview.textContent = kindLabel(kind)
    }

    return preview
  }

  /** Apply checkerboard + color fill inline (avoids CSS parent/child selector issues) */
  function applySwatchStyles(el: HTMLElement, color: string): void {
    el.style.cssText = `
      width:100%;height:100%;border-radius:4px;
      background:
        linear-gradient(${color},${color}),
        repeating-conic-gradient(#808080 0% 25%, #404040 0% 50%) 0 0 / 8px 8px;
    `
  }

  function copyText(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  function downloadUrl(url: string, filename: string): void {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function downloadBlob(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    downloadUrl(url, filename)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  let toastTimer: ReturnType<typeof setTimeout> | null = null
  function showToast(): void {
    toast.classList.add('visible')
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 1200)
  }

  function positionNearElement(): void {
    if (!target) return
    const pos = computeToolPanelPosition(target, 280, container.offsetHeight || 420)
    container.style.left = `${pos.left}px`
    container.style.top = `${pos.top}px`
  }

  function onScrollOrResize(): void {
    positionNearElement()
  }

  // ── Scan (handles multi-select) ──

  function scan(): void {
    const selectors = getPersistentSelectionSelectors()
    if (selectors.length > 1) {
      const elements: Element[] = []
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) elements.push(el)
      }
      assets = scanMultipleElements(elements)
      header.innerHTML = `<span>${selectors.length} elements</span><span class="count">${totalCount()}</span>`
    } else if (target) {
      assets = scanElementAssets(target)
      const tag = target.tagName.toLowerCase()
      const id = target.id ? `#${target.id}` : ''
      header.innerHTML = `<span>${tag}${id}</span><span class="count">${totalCount()}</span>`
    }
  }

  function totalCount(): number {
    return assets.images.length + assets.svgs.length + assets.fonts.length + assets.colors.length + assets.variables.length
  }

  // ── Keyboard focus helpers ──

  function getItems(): HTMLElement[] {
    return Array.from(list.querySelectorAll('.flow-asset-item')) as HTMLElement[]
  }

  function setFocusedIndex(index: number): void {
    const items = getItems()
    // Clear previous
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      items[focusedIndex].classList.remove('focused')
    }
    focusedIndex = index
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      items[focusedIndex].classList.add('focused')
      items[focusedIndex].scrollIntoView({ block: 'nearest' })
    }
  }

  const ALL_ASSET_TABS: AssetSubTab[] = ['images', 'svgs', 'fonts', 'colors', 'variables']

  function getVisibleTabs(): AssetSubTab[] {
    if (activeTopTab !== 'assets') return []
    return ALL_ASSET_TABS.filter(t => {
      switch (t) {
        case 'images': return assets.images.length > 0
        case 'svgs': return assets.svgs.length > 0
        case 'fonts': return assets.fonts.length > 0
        case 'colors': return assets.colors.length > 0
        case 'variables': return assets.variables.length > 0
      }
    })
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!target) return
    const items = getItems()

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        e.stopPropagation()
        const next = items.length > 0 ? Math.min(focusedIndex + 1, items.length - 1) : -1
        setFocusedIndex(next)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        e.stopPropagation()
        const prev = items.length > 0 ? Math.max(focusedIndex - 1, 0) : -1
        setFocusedIndex(prev)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        e.stopPropagation()
        const visLeft = getVisibleTabs()
        if (visLeft.length === 0) break
        const curL = visLeft.indexOf(activeTab)
        activeTab = visLeft[(curL - 1 + visLeft.length) % visLeft.length]
        focusedIndex = -1
        renderTabs()
        renderList()
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        e.stopPropagation()
        const visRight = getVisibleTabs()
        if (visRight.length === 0) break
        const curR = visRight.indexOf(activeTab)
        activeTab = visRight[(curR + 1) % visRight.length]
        focusedIndex = -1
        renderTabs()
        renderList()
        break
      }
      case 'Enter': {
        e.preventDefault()
        e.stopPropagation()
        if (focusedIndex >= 0 && focusedIndex < itemCopyCallbacks.length) {
          itemCopyCallbacks[focusedIndex]()
          showToast()
        }
        break
      }
    }
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      container.style.display = ''
      focusedIndex = -1
      scan()
      renderTopTabs()
      renderContent()
      positionNearElement()
      // Defensive removal prevents listener stacking if attach called without detach
      document.removeEventListener('keydown', onKeyDown)
      document.addEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.removeEventListener('resize', onScrollOrResize)
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      list.innerHTML = ''
      focusedIndex = -1
      itemCopyCallbacks.length = 0
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      container.remove()
      styleEl.remove()
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },
  }
}
