/**
 * Shared Tool Panel Header
 *
 * Renders a header row with the current mode label + chevron.
 * Clicking the chevron opens a dropdown listing all 8 design sub-modes.
 * Selecting a sub-mode dispatches a custom event that content.ts listens for.
 *
 * Uses a singleton dropdown per shadow root — one DOM element, one pair of
 * document listeners — shared across all tool headers. Only the active
 * header's click opens it; document click / Escape closes it.
 */

import { DESIGN_SUB_MODES, type DesignSubMode } from '@flow/shared'
import styles from './toolPanelHeader.css?inline'

export interface ToolPanelHeaderOptions {
  /** Shadow root to append the dropdown menu to (avoids overflow clipping) */
  shadowRoot: ShadowRoot
  /** The currently active design sub-mode ID */
  currentModeId: DesignSubMode
}

export interface ToolPanelHeader {
  /** The header element to insert as first child of the tool container */
  header: HTMLDivElement
  /** Remove the header element (dropdown singleton is ref-counted) */
  destroy: () => void
}

// ── Singleton dropdown per shadow root ──

interface DropdownSingleton {
  el: HTMLElement
  refCount: number
  activeHeader: HTMLElement | null
  activeModeId: DesignSubMode | null
  open: boolean
  onDocumentClick: () => void
  onKeyDown: (e: KeyboardEvent) => void
}

const singletons = new WeakMap<ShadowRoot, DropdownSingleton>()

function getSingleton(shadowRoot: ShadowRoot): DropdownSingleton {
  let s = singletons.get(shadowRoot)
  if (s) {
    s.refCount++
    return s
  }

  // Inject styles once
  if (!shadowRoot.querySelector('[data-flow-tool-header-styles]')) {
    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-flow-tool-header-styles', '')
    styleEl.textContent = styles
    shadowRoot.appendChild(styleEl)
  }

  // Build dropdown DOM
  const dropdown = document.createElement('div')
  dropdown.className = 'flow-tool-header-dropdown'

  for (const mode of DESIGN_SUB_MODES) {
    const item = document.createElement('div')
    item.className = 'flow-tool-header-item'
    item.dataset.modeId = mode.id

    const keyBadge = document.createElement('span')
    keyBadge.className = 'flow-tool-header-item-key'
    keyBadge.textContent = mode.key
    item.appendChild(keyBadge)

    const itemLabel = document.createElement('span')
    itemLabel.className = 'flow-tool-header-item-label'
    itemLabel.textContent = mode.label
    item.appendChild(itemLabel)

    item.addEventListener('click', (e) => {
      e.stopPropagation()
      closeSingleton(s!)
      shadowRoot.dispatchEvent(new CustomEvent('flow:request-sub-mode', {
        detail: { subMode: mode.id },
        bubbles: true,
      }))
    })

    dropdown.appendChild(item)
  }

  shadowRoot.appendChild(dropdown)

  // Document listeners (one pair total)
  const onDocumentClick = () => {
    if (s!.open) closeSingleton(s!)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (s!.open && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeSingleton(s!)
    }
  }

  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown, true)

  s = {
    el: dropdown,
    refCount: 1,
    activeHeader: null,
    activeModeId: null,
    open: false,
    onDocumentClick,
    onKeyDown,
  }
  singletons.set(shadowRoot, s)
  return s
}

function releaseSingleton(shadowRoot: ShadowRoot): void {
  const s = singletons.get(shadowRoot)
  if (!s) return
  s.refCount--
  if (s.refCount <= 0) {
    closeSingleton(s)
    document.removeEventListener('click', s.onDocumentClick)
    document.removeEventListener('keydown', s.onKeyDown, true)
    s.el.remove()
    singletons.delete(shadowRoot)
  }
}

function openSingleton(s: DropdownSingleton, header: HTMLElement, modeId: DesignSubMode): void {
  s.open = true
  s.activeHeader = header
  s.activeModeId = modeId
  header.classList.add('dropdown-open')

  // Highlight active item
  s.el.querySelectorAll('.flow-tool-header-item').forEach((item) => {
    const el = item as HTMLElement
    el.classList.toggle('active', el.dataset.modeId === modeId)
  })

  positionDropdown(s, header)
}

function closeSingleton(s: DropdownSingleton): void {
  s.open = false
  s.el.classList.remove('open')
  if (s.activeHeader) {
    s.activeHeader.classList.remove('dropdown-open')
    s.activeHeader = null
  }
}

function positionDropdown(s: DropdownSingleton, header: HTMLElement): void {
  const dropdown = s.el
  const headerRect = header.getBoundingClientRect()
  dropdown.style.left = `${headerRect.left}px`
  dropdown.style.width = `${Math.max(headerRect.width, 180)}px`

  // Measure height off-screen using visibility instead of display toggle
  dropdown.style.top = '-9999px'
  dropdown.style.visibility = 'hidden'
  dropdown.classList.add('open')
  const menuH = dropdown.offsetHeight
  dropdown.style.visibility = ''

  // Default: below header
  let top = headerRect.bottom + 4
  if (top + menuH > window.innerHeight - 8) {
    top = headerRect.top - menuH - 4
  }
  top = Math.max(8, top)
  dropdown.style.top = `${top}px`
}

// ── Public factory ──

export function createToolPanelHeader(options: ToolPanelHeaderOptions): ToolPanelHeader {
  const { shadowRoot, currentModeId } = options
  const singleton = getSingleton(shadowRoot)

  const header = document.createElement('div')
  header.className = 'flow-tool-header'

  const labelEl = document.createElement('span')
  labelEl.className = 'flow-tool-header-label'
  labelEl.textContent = getLabelForMode(currentModeId)
  header.appendChild(labelEl)

  const chevron = document.createElement('span')
  chevron.className = 'flow-tool-header-chevron'
  chevron.textContent = '\u2228'
  header.appendChild(chevron)

  header.addEventListener('click', (e) => {
    e.stopPropagation()
    if (singleton.open && singleton.activeHeader === header) {
      closeSingleton(singleton)
    } else {
      closeSingleton(singleton)
      openSingleton(singleton, header, currentModeId)
    }
  })

  function destroy() {
    if (singleton.open && singleton.activeHeader === header) {
      closeSingleton(singleton)
    }
    header.remove()
    releaseSingleton(shadowRoot)
  }

  return { header, destroy }
}

function getLabelForMode(id: DesignSubMode): string {
  const config = DESIGN_SUB_MODES.find(m => m.id === id)
  return config?.label ?? id.charAt(0).toUpperCase() + id.slice(1)
}
