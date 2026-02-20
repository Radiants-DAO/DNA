/**
 * Shared Tool Panel Header
 *
 * Renders a header row with the current mode label + chevron.
 * Clicking the chevron opens a dropdown listing all 8 design sub-modes.
 * Selecting a sub-mode dispatches a custom event that content.ts listens for.
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
  /** Update which mode is shown as active (label + dropdown highlight) */
  updateActiveMode: (id: DesignSubMode) => void
  /** Clean up event listeners and remove dropdown from shadow root */
  destroy: () => void
}

export function createToolPanelHeader(options: ToolPanelHeaderOptions): ToolPanelHeader {
  const { shadowRoot, currentModeId } = options

  let activeModeId = currentModeId
  let dropdownOpen = false

  // Inject styles (idempotent — multiple tools may call this)
  if (!shadowRoot.querySelector('[data-flow-tool-header-styles]')) {
    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-flow-tool-header-styles', '')
    styleEl.textContent = styles
    shadowRoot.appendChild(styleEl)
  }

  // ── Header row ──

  const header = document.createElement('div')
  header.className = 'flow-tool-header'

  const labelEl = document.createElement('span')
  labelEl.className = 'flow-tool-header-label'
  labelEl.textContent = getLabelForMode(activeModeId)
  header.appendChild(labelEl)

  const chevron = document.createElement('span')
  chevron.className = 'flow-tool-header-chevron'
  chevron.textContent = '\u2228'
  header.appendChild(chevron)

  // ── Dropdown menu (appended to shadowRoot to avoid overflow clipping) ──

  const dropdown = document.createElement('div')
  dropdown.className = 'flow-tool-header-dropdown'

  for (const mode of DESIGN_SUB_MODES) {
    const item = document.createElement('div')
    item.className = 'flow-tool-header-item'
    if (mode.id === activeModeId) item.classList.add('active')
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
      closeDropdown()
      // Dispatch custom event for content.ts to handle
      shadowRoot.dispatchEvent(new CustomEvent('flow:request-sub-mode', {
        detail: { subMode: mode.id },
        bubbles: true,
        composed: true,
      }))
    })

    dropdown.appendChild(item)
  }

  shadowRoot.appendChild(dropdown)

  // ── Event handlers ──

  function toggleDropdown() {
    if (dropdownOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  function openDropdown() {
    dropdownOpen = true
    dropdown.classList.add('open')
    header.classList.add('dropdown-open')
    // Highlight active item
    dropdown.querySelectorAll('.flow-tool-header-item').forEach((item) => {
      const el = item as HTMLElement
      el.classList.toggle('active', el.dataset.modeId === activeModeId)
    })
    positionDropdown()
  }

  function closeDropdown() {
    dropdownOpen = false
    dropdown.classList.remove('open')
    header.classList.remove('dropdown-open')
  }

  function positionDropdown() {
    const headerRect = header.getBoundingClientRect()
    dropdown.style.left = `${headerRect.left}px`
    dropdown.style.width = `${Math.max(headerRect.width, 180)}px`

    // Default: below header
    let top = headerRect.bottom + 4
    // Measure height
    dropdown.style.top = '-9999px'
    dropdown.style.display = 'block'
    const menuH = dropdown.offsetHeight
    dropdown.style.display = ''
    dropdown.classList.add('open')

    // Flip above if overflows viewport
    if (top + menuH > window.innerHeight - 8) {
      top = headerRect.top - menuH - 4
    }
    top = Math.max(8, top)
    dropdown.style.top = `${top}px`
  }

  function onDocumentClick() {
    if (dropdownOpen) closeDropdown()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (dropdownOpen && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeDropdown()
    }
  }

  header.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleDropdown()
  })

  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeyDown, true)

  // ── Public API ──

  function updateActiveMode(id: DesignSubMode) {
    activeModeId = id
    labelEl.textContent = getLabelForMode(id)
    dropdown.querySelectorAll('.flow-tool-header-item').forEach((item) => {
      const el = item as HTMLElement
      el.classList.toggle('active', el.dataset.modeId === id)
    })
  }

  function destroy() {
    closeDropdown()
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeyDown, true)
    dropdown.remove()
    header.remove()
  }

  return { header, updateActiveMode, destroy }
}

function getLabelForMode(id: DesignSubMode): string {
  const config = DESIGN_SUB_MODES.find(m => m.id === id)
  return config?.label ?? id.charAt(0).toUpperCase() + id.slice(1)
}
