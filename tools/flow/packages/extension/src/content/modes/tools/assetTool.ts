import { computeToolPanelPosition } from './toolPanelPosition'
import { scanElementAssets, scanMultipleElements, type ElementAssets } from './assetScanner'
import { getPersistentSelectionSelectors } from '../../overlays/persistentSelections'
import styles from './assetTool.css?inline'

// ── Icons (inline SVG) ──

const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'

// ── Types ──

// NOTE: No engine needed — Asset Mode is read-only (no mutations).
export interface AssetToolOptions {
  shadowRoot: ShadowRoot
}

export interface AssetTool {
  attach: (element: HTMLElement) => void
  detach: () => void
  destroy: () => void
}

type TabId = 'images' | 'svgs' | 'fonts' | 'variables'

const TAB_LABELS: Record<TabId, string> = {
  images: 'Images',
  svgs: 'SVGs',
  fonts: 'Fonts',
  variables: 'Variables',
}

// ── Factory ──

export function createAssetTool({ shadowRoot }: AssetToolOptions): AssetTool {

  // Inject CSS
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // Build DOM
  const container = document.createElement('div')
  container.className = 'flow-asset-panel'
  shadowRoot.appendChild(container)

  const header = document.createElement('div')
  header.className = 'flow-asset-header'
  container.appendChild(header)

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
  let assets: ElementAssets = { images: [], svgs: [], fonts: [], variables: [] }
  let activeTab: TabId = 'images'

  // ── Tab rendering ──

  function renderTabs(): void {
    tabBar.innerHTML = ''
    const tabs: TabId[] = ['images', 'svgs', 'fonts', 'variables']
    const counts: Record<TabId, number> = {
      images: assets.images.length,
      svgs: assets.svgs.length,
      fonts: assets.fonts.length,
      variables: assets.variables.length,
    }

    // Auto-select first non-empty tab
    if (counts[activeTab] === 0) {
      const firstNonEmpty = tabs.find(t => counts[t] > 0)
      if (firstNonEmpty) activeTab = firstNonEmpty
    }

    for (const tabId of tabs) {
      const tab = document.createElement('div')
      tab.className = `flow-asset-tab${tabId === activeTab ? ' active' : ''}`
      tab.innerHTML = `${TAB_LABELS[tabId]}<span class="tab-count">${counts[tabId]}</span>`
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

      case 'variables':
        if (assets.variables.length === 0) return renderEmpty('No CSS variables found')
        for (const v of assets.variables) {
          const isColor = isColorValue(v.value)
          const item = createItem(
            () => {
              const preview = document.createElement('div')
              if (isColor) {
                preview.className = 'color-swatch'
                preview.style.background = v.value
              } else {
                preview.textContent = '--'
                preview.style.fontSize = '10px'
                preview.style.color = '#666'
              }
              return preview
            },
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

  function isColorValue(value: string): boolean {
    return /^(#|rgb|hsl|oklch|oklab|lch|lab|color\()/.test(value.trim())
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
    return assets.images.length + assets.svgs.length + assets.fonts.length + assets.variables.length
  }

  // ── Public API ──

  return {
    attach(element: HTMLElement) {
      target = element
      container.style.display = ''
      scan()
      renderTabs()
      renderList()
      positionNearElement()
      window.addEventListener('scroll', onScrollOrResize, { passive: true })
      window.addEventListener('resize', onScrollOrResize, { passive: true })
    },

    detach() {
      target = null
      container.style.display = 'none'
      list.innerHTML = ''
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },

    destroy() {
      container.remove()
      styleEl.remove()
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    },
  }
}
