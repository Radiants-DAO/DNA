# Asset Mode Implementation Plan

> **Status: SUPERSEDED** — Asset mode was built as `assetTool.ts` then folded into the unified Inspect mode (2026-02-20-unified-inspect-mode.md). The Assets tab in the Inspect panel (`inspectPanel.ts`) carries forward all asset scanning, copy, and download functionality. The standalone `'asset'` top-level mode no longer exists.

**Goal:** Add an "Asset Mode" (`A` key) that shows a floating popover listing all assets (images, SVGs, fonts, CSS variables) within a clicked element, with copy and download actions. Works with multi-select (merged deduplicated list).

**Architecture:** New top-level mode `'asset'` registered in the shared mode system. A `createAssetTool` factory following the existing tool pattern (shadow DOM popover, `attach/detach/destroy`). Per-element scanning runs content-side — no `inspectedWindow.eval` needed. Multi-select merges assets from all selected elements via `getPersistentSelectionSelectors()`.

**Tech Stack:** TypeScript, Shadow DOM (vanilla JS), CSS `?inline` imports, existing `customProperties.ts` for variable extraction.

**Note (session context):** The multi-select proxy, shift-click toggle, marquee selection, `onPersistentSelectionChange` callback, and `computeToolPanelPosition` utility were all implemented earlier in this session. Asset mode inherits these automatically — no per-mode wiring needed for multi-select UX. The `rawEngine` / `unifiedMutationEngine` (proxy) split in content.ts is also already in place. Since Asset Mode is read-only (no mutations), it does NOT need the mutation engine at all.

**Brainstorm:** `docs/brainstorms/2026-02-20-asset-mode-brainstorm.md`

---

## Task 1: Register `'asset'` Top-Level Mode ✅

**Files:**
- Modify: `packages/shared/src/types/modes.ts` (union + config array)
- Modify: `packages/extension/src/content/ui/toolbar.ts` (MODES array)

**Step 1: Add `'asset'` to the `TopLevelMode` union**

In `packages/shared/src/types/modes.ts`, add `'asset'` to the union (after `'editText'`):

```ts
export type TopLevelMode =
  | 'default'
  | 'select'
  | 'design'
  | 'comment'
  | 'question'
  | 'search'
  | 'inspector'
  | 'editText'
  | 'asset'
```

**Step 2: Add `ModeConfig` entry to `TOP_LEVEL_MODES`**

Append before the closing `] as const`:

```ts
{
  id: 'asset',
  hotkey: 'a',
  label: 'Assets',
  interceptsEvents: true,
  showsHoverOverlay: true,
},
```

`interceptsEvents: true` — asset mode intercepts clicks to select elements.
`showsHoverOverlay: true` — hover highlight helps users see what they'll inspect.

**Step 3: Add toolbar button**

In `packages/extension/src/content/ui/toolbar.ts`, append to the `MODES` array:

```ts
{
  id: 'asset',
  label: 'Assets',
  shortcut: 'A',
  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
},
```

**Step 4: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

Expected: no new errors. The hotkey system (`modeHotkeys.ts`) and toolbar are both data-driven — they auto-pick up the new mode.

**Step 5: Build and verify toolbar**

```bash
pnpm build
```

Reload extension. Press `A` — toolbar should highlight the new Assets button. Clicking elements should trigger the selection flow (hover overlay + click intercept).

**Step 6: Commit**

```
feat: register asset top-level mode with A hotkey
```

---

## Task 2: Per-Element Asset Scanner ✅

**Files:**
- Create: `packages/extension/src/content/modes/tools/assetScanner.ts`

This is a content-side scanner that extracts assets from a single element and its descendants. No `eval()` needed — runs in the content script context.

**Step 1: Create the scanner module**

```ts
// assetScanner.ts

import { extractCustomProperties } from '../../../agent/customProperties'
import type { CustomProperty } from '@flow/shared'

// ── Types ──

export interface ScannedAssetImage {
  src: string
  alt: string
  width: number
  height: number
  isBackground: boolean
}

export interface ScannedAssetSVG {
  markup: string
  /** First 60 chars of outerHTML for display */
  preview: string
  width: number
  height: number
}

export interface ScannedAssetFont {
  family: string
  weight: string
  style: string
  src?: string
}

export interface ElementAssets {
  images: ScannedAssetImage[]
  svgs: ScannedAssetSVG[]
  fonts: ScannedAssetFont[]
  variables: CustomProperty[]
}

// ── Scanner ──

export function scanElementAssets(root: Element): ElementAssets {
  const images: ScannedAssetImage[] = []
  const svgs: ScannedAssetSVG[] = []
  const fonts: ScannedAssetFont[] = []
  const seenImageSrc = new Set<string>()
  const seenSvgMarkup = new Set<string>()
  const seenFontFamily = new Set<string>()

  // Images: <img> elements
  for (const img of root.querySelectorAll('img')) {
    const src = (img as HTMLImageElement).src
    if (!src || seenImageSrc.has(src)) continue
    seenImageSrc.add(src)
    images.push({
      src,
      alt: (img as HTMLImageElement).alt || '',
      width: (img as HTMLImageElement).naturalWidth || (img as HTMLImageElement).width,
      height: (img as HTMLImageElement).naturalHeight || (img as HTMLImageElement).height,
      isBackground: false,
    })
  }

  // Also check the root itself if it's an <img>
  if (root.tagName === 'IMG') {
    const img = root as HTMLImageElement
    if (img.src && !seenImageSrc.has(img.src)) {
      seenImageSrc.add(img.src)
      images.push({
        src: img.src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        isBackground: false,
      })
    }
  }

  // Background images on root + descendants
  const allEls = [root, ...root.querySelectorAll('*')]
  for (const el of allEls) {
    const bg = getComputedStyle(el).backgroundImage
    if (bg && bg !== 'none') {
      const urlMatch = bg.match(/url\(["']?(.+?)["']?\)/)
      if (urlMatch && !seenImageSrc.has(urlMatch[1])) {
        seenImageSrc.add(urlMatch[1])
        images.push({
          src: urlMatch[1],
          alt: '',
          width: 0,
          height: 0,
          isBackground: true,
        })
      }
    }
  }

  // SVGs: <svg> elements
  for (const svg of root.querySelectorAll('svg')) {
    const markup = svg.outerHTML
    const hash = markup.slice(0, 200)
    if (seenSvgMarkup.has(hash)) continue
    seenSvgMarkup.add(hash)
    const box = svg.getBoundingClientRect()
    svgs.push({
      markup,
      preview: markup.slice(0, 60) + (markup.length > 60 ? '...' : ''),
      width: Math.round(box.width),
      height: Math.round(box.height),
    })
  }

  // Also check if root itself is an <svg>
  if (root.tagName === 'svg' || root.tagName === 'SVG') {
    const markup = (root as SVGElement).outerHTML
    const hash = markup.slice(0, 200)
    if (!seenSvgMarkup.has(hash)) {
      seenSvgMarkup.add(hash)
      const box = root.getBoundingClientRect()
      svgs.push({
        markup,
        preview: markup.slice(0, 60) + (markup.length > 60 ? '...' : ''),
        width: Math.round(box.width),
        height: Math.round(box.height),
      })
    }
  }

  // Fonts: computed font families on root + descendants
  for (const el of allEls) {
    const computed = getComputedStyle(el)
    const families = computed.fontFamily.split(',').map(f => f.trim().replace(/^["']|["']$/g, ''))
    for (const family of families) {
      if (!family || seenFontFamily.has(family)) continue
      seenFontFamily.add(family)
      fonts.push({
        family,
        weight: computed.fontWeight,
        style: computed.fontStyle,
      })
    }
  }

  // CSS variables: use existing extractor
  const variables = root instanceof HTMLElement
    ? extractCustomProperties(root)
    : []

  return { images, svgs, fonts, variables }
}

/**
 * Scan multiple elements and merge/deduplicate results.
 */
export function scanMultipleElements(elements: Element[]): ElementAssets {
  const merged: ElementAssets = { images: [], svgs: [], fonts: [], variables: [] }
  const seenImageSrc = new Set<string>()
  const seenSvgHash = new Set<string>()
  const seenFont = new Set<string>()
  const seenVar = new Set<string>()

  for (const el of elements) {
    const assets = scanElementAssets(el)

    for (const img of assets.images) {
      if (!seenImageSrc.has(img.src)) {
        seenImageSrc.add(img.src)
        merged.images.push(img)
      }
    }
    for (const svg of assets.svgs) {
      const hash = svg.markup.slice(0, 200)
      if (!seenSvgHash.has(hash)) {
        seenSvgHash.add(hash)
        merged.svgs.push(svg)
      }
    }
    for (const font of assets.fonts) {
      if (!seenFont.has(font.family)) {
        seenFont.add(font.family)
        merged.fonts.push(font)
      }
    }
    for (const v of assets.variables) {
      if (!seenVar.has(v.name)) {
        seenVar.add(v.name)
        merged.variables.push(v)
      }
    }
  }

  return merged
}
```

**Step 2: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

**Step 3: Commit**

```
feat: add per-element asset scanner with multi-select merge
```

---

## Task 3: Asset Tool Popover — CSS ✅

**Files:**
- Create: `packages/extension/src/content/modes/tools/assetTool.css`

**Step 1: Write the CSS**

Follow the naming convention of other tools (`flow-asset-*`). Key elements: container, tab bar, scrollable list, asset items with action buttons, copy feedback toast.

```css
.flow-asset-panel {
  position: fixed;
  width: 280px;
  max-height: 420px;
  background: var(--flow-tool-bg, #1a1a1a);
  border: 1px solid var(--flow-tool-border, rgba(255,255,255,0.1));
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: none;
  z-index: 2147483645;
  font-family: system-ui, -apple-system, sans-serif;
  color: var(--flow-tool-text, #e5e5e5);
  overflow: hidden;
}

.flow-asset-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--flow-tool-text-dim, #999);
  border-bottom: 1px solid var(--flow-tool-border, rgba(255,255,255,0.08));
  display: flex;
  align-items: center;
  gap: 6px;
}

.flow-asset-header .count {
  background: var(--flow-tool-accent, #3b82f6);
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
}

.flow-asset-tabs {
  display: flex;
  border-bottom: 1px solid var(--flow-tool-border, rgba(255,255,255,0.08));
}

.flow-asset-tab {
  flex: 1;
  padding: 6px 4px;
  font-size: 10px;
  text-align: center;
  cursor: pointer;
  color: var(--flow-tool-text-dim, #999);
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.flow-asset-tab:hover {
  color: var(--flow-tool-text, #e5e5e5);
}

.flow-asset-tab.active {
  color: var(--flow-tool-accent, #3b82f6);
  border-bottom-color: var(--flow-tool-accent, #3b82f6);
}

.flow-asset-tab .tab-count {
  font-size: 9px;
  opacity: 0.6;
  margin-left: 2px;
}

.flow-asset-list {
  overflow-y: auto;
  max-height: 320px;
  padding: 4px;
}

.flow-asset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: default;
  transition: background 0.1s;
}

.flow-asset-item:hover {
  background: rgba(255,255,255,0.05);
}

.flow-asset-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.flow-asset-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.flow-asset-preview svg {
  width: 20px;
  height: 20px;
}

.flow-asset-preview.color-swatch {
  border: 1px solid rgba(255,255,255,0.15);
}

.flow-asset-preview.font-preview {
  font-size: 16px;
  font-weight: 700;
}

.flow-asset-info {
  flex: 1;
  min-width: 0;
}

.flow-asset-name {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flow-asset-meta {
  font-size: 9px;
  color: var(--flow-tool-text-dim, #999);
  margin-top: 1px;
}

.flow-asset-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
}

.flow-asset-item:hover .flow-asset-actions {
  opacity: 1;
}

.flow-asset-action {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--flow-tool-text-dim, #999);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.flow-asset-action:hover {
  background: rgba(255,255,255,0.1);
  color: var(--flow-tool-text, #e5e5e5);
}

.flow-asset-action svg {
  width: 14px;
  height: 14px;
}

.flow-asset-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: var(--flow-tool-text-dim, #666);
}

.flow-asset-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #10b981;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.flow-asset-toast.visible {
  opacity: 1;
}
```

**Step 2: Commit**

```
feat: add asset tool CSS styles
```

---

## Task 4: Asset Tool — Factory and DOM ✅

**Files:**
- Create: `packages/extension/src/content/modes/tools/assetTool.ts`

**Step 1: Create the tool factory**

This is the main file. Follows the colorTool pattern: inject CSS, build DOM, position near element, render asset list.

```ts
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
```

**Step 2: Typecheck**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
```

**Step 3: Commit**

```
feat: add asset tool popover with tabs, copy, and download
```

---

## Task 5: Wire Asset Tool into Content Script ✅

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Import and create the asset tool**

Add import near the other tool imports:

```ts
import { createAssetTool } from '../content/modes/tools/assetTool'
```

Create the tool instance alongside other tools (after `typographyTool`). No engine needed — asset mode is read-only:

```ts
const assetTool = createAssetTool({
  shadowRoot: overlayRoot,
})
```

Add tracking variable:

```ts
let assetToolAttached = false
```

**Step 2: Wire attach/detach on mode changes**

In the `modeController.subscribe` callback, add asset tool handling. Unlike design sub-mode tools, asset mode is a **top-level mode**, so the logic is:

```ts
// Asset tool — top-level mode, not a design sub-mode
if (state.topLevel === 'asset' && selectedElement) {
  if (!assetToolAttached) {
    assetTool.attach(selectedElement as HTMLElement)
    assetToolAttached = true
  }
} else if (assetToolAttached) {
  assetTool.detach()
  assetToolAttached = false
}
```

**Step 3: Wire attach on click in asset mode**

In the `onClick` handler, after the design tool attach block (`if (currentState.topLevel === 'design')`), add:

```ts
if (currentState.topLevel === 'asset') {
  if (!(el instanceof HTMLElement)) {
    console.warn('[Flow] Selected node is not an HTMLElement; skipping asset tool attach.')
  } else {
    try {
      assetTool.detach()
      assetTool.attach(el)
      assetToolAttached = true
    } catch (error) {
      console.error('[Flow] Failed to attach asset tool:', error)
    }
  }
}
```

**Step 4: Add cleanup on disconnect**

In the `catch` block of `setupDisconnectHandler`, add:

```ts
assetTool.destroy()
```

**Step 5: Typecheck and build**

```bash
pnpm -r typecheck 2>&1 | grep "error TS" | grep -v "promptBuilderSlice.test"
pnpm build
```

**Step 6: Manual test**

- Reload extension
- Press `A` to enter asset mode
- Click an element with images → popover shows image list
- Click copy → clipboard has src URL
- Click download → file downloads
- Switch tabs (SVGs, Fonts, Variables)
- Shift-click multiple elements → merged list (inherits from multi-select system)
- Shift-click a selected element → deselects it (inherits from shift-click toggle)
- Shift+drag marquee → selects sibling elements (inherits from marquee selection)
- Panel avoids overlapping other selection outlines (inherits from `computeToolPanelPosition`)
- Press `D` to switch to design mode → asset popover disappears
- Press `A` again → asset mode, click → popover reappears

**Step 7: Commit**

```
feat: wire asset tool into content script with mode system
```

---

## Task 6: Polish and Edge Cases ✅

**Files:**
- Modify: `packages/extension/src/content/modes/tools/assetTool.ts`
- Modify: `packages/extension/src/content/modes/tools/assetScanner.ts`

**Step 1: Handle empty elements gracefully**

The empty state rendering is already in place. Verify that clicking an element with zero assets shows "No images found" (etc.) across all tabs.

**Step 2: Handle large SVGs**

SVG `outerHTML` can be huge. Cap the stored `markup` at 50KB:

In `assetScanner.ts`, in the SVG scanning section:

```ts
if (markup.length > 50_000) continue  // skip enormous inline SVGs
```

**Step 3: Font source URLs**

Currently `ScannedAssetFont.src` is always undefined because we only read computed styles. Enhance the scanner to walk `document.styleSheets` for `@font-face` rules matching the family:

```ts
// After collecting fonts from computed styles, try to find @font-face URLs
try {
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim()
          const font = fonts.find(f => f.family === family)
          if (font && !font.src) {
            const src = rule.style.getPropertyValue('src')
            const urlMatch = src.match(/url\(["']?(.+?)["']?\)/)
            if (urlMatch) font.src = urlMatch[1]
          }
        }
      }
    } catch { /* cross-origin stylesheet */ }
  }
} catch { /* no styleSheets access */ }
```

**Step 4: Build and test**

```bash
pnpm build
```

**Step 5: Commit**

```
feat: asset mode polish — SVG cap, font source URLs, empty states
```

---

## Files Summary

| File | Action |
|------|--------|
| `shared/src/types/modes.ts` | Add `'asset'` to union + config |
| `extension/src/content/ui/toolbar.ts` | Add toolbar button |
| `extension/src/content/modes/tools/assetScanner.ts` | **New** — per-element scanner |
| `extension/src/content/modes/tools/assetTool.css` | **New** — popover styles |
| `extension/src/content/modes/tools/assetTool.ts` | **New** — tool factory |
| `extension/src/entrypoints/content.ts` | Wire tool creation + attach/detach |

No changes needed to: `modeHotkeys.ts`, `modes/types.ts`, `eventInterceptor.ts`, `Panel.tsx`, or any panel components. The mode system is fully data-driven for top-level modes.
