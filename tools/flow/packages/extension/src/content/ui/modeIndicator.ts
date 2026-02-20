/**
 * Mode Indicator — top-right pill + closable explainer toast
 *
 * Shows the currently active mode as a compact pill in the top-right corner.
 * On mode activation, an explainer toast appears below the pill with a
 * description and keyboard hints. The toast is closable and auto-dismisses
 * after a timeout. Hidden when mode is 'default'.
 */

import {
  TOP_LEVEL_MODES,
  DESIGN_SUB_MODES,
  type TopLevelMode,
  type DesignSubMode,
  type ModeState,
} from '../modes/types'
import styles from './modeIndicator.css?inline'

// ── Mode explainer content ──

interface ModeExplainer {
  description: string
  keys?: string[]
}

const MODE_EXPLAINERS: Partial<Record<TopLevelMode, ModeExplainer>> = {
  design: {
    description: 'Edit visual properties of selected elements. Use number keys to switch between sub-modes.',
    keys: ['1-7 sub-modes', 'Click to select', 'Shift+Click multi-select'],
  },
  move: {
    description: 'Reorder elements in the DOM. Click to select, then use arrow keys or drag to reposition.',
    keys: ['↑↓ reorder', '←→ promote/demote', 'Shift = first/last', 'Drag to reorder'],
  },
  comment: {
    description: 'Click any element to leave a comment or question for your team.',
    keys: ['Click to place', 'Esc to exit'],
  },
  question: {
    description: 'Click an element to ask a question. The AI will respond with context about that element.',
    keys: ['Click to ask', 'Esc to exit'],
  },
  search: {
    description: 'Search the page by CSS selector, text content, or fuzzy match.',
    keys: ['Type to search', 'Esc to exit'],
  },
  inspector: {
    description: 'Hover over elements to see their computed CSS properties in a tooltip.',
    keys: ['Hover to inspect', 'Click to pin', 'Esc to exit'],
  },
  editText: {
    description: 'Click any text element to edit its content in place.',
    keys: ['Click text to edit', 'Esc to exit'],
  },
  asset: {
    description: 'Inspect images, SVGs, fonts, and CSS custom properties on the page.',
    keys: ['Click to inspect', 'Esc to exit'],
  },
  select: {
    description: 'Hover to highlight elements. Click to select for inspection.',
    keys: ['Click to select', 'Esc to exit'],
  },
}

const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'

const AUTO_DISMISS_MS = 8000

// ── Public API ──

export interface ModeIndicator {
  /** Update the indicator to reflect current mode state. */
  update: (state: ModeState) => void
  /** Remove all DOM elements and clean up. */
  destroy: () => void
}

export function createModeIndicator(shadowRoot: ShadowRoot): ModeIndicator {
  // Inject styles
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  // Container
  const container = document.createElement('div')
  container.className = 'flow-mode-indicator'
  container.toggleAttribute('data-hidden', true)
  shadowRoot.appendChild(container)

  // Pill
  const pill = document.createElement('div')
  pill.className = 'flow-mode-pill'
  container.appendChild(pill)

  const pillDot = document.createElement('span')
  pillDot.className = 'flow-mode-pill-dot'
  pill.appendChild(pillDot)

  const pillLabel = document.createElement('span')
  pillLabel.className = 'flow-mode-pill-label'
  pill.appendChild(pillLabel)

  const pillKey = document.createElement('span')
  pillKey.className = 'flow-mode-pill-key'
  pill.appendChild(pillKey)

  // Explainer toast (built lazily on each mode change)
  let explainer: HTMLElement | null = null
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let currentMode: TopLevelMode | null = null

  function showExplainer(mode: TopLevelMode, subMode: DesignSubMode | null) {
    hideExplainer()

    const content = MODE_EXPLAINERS[mode]
    if (!content) return

    explainer = document.createElement('div')
    explainer.className = 'flow-mode-explainer'

    // Header with close button
    const header = document.createElement('div')
    header.className = 'flow-mode-explainer-header'

    const title = document.createElement('span')
    title.className = 'flow-mode-explainer-title'
    if (mode === 'design' && subMode) {
      const subConfig = DESIGN_SUB_MODES.find(s => s.id === subMode)
      title.textContent = subConfig ? `${subConfig.label} Mode` : 'Design Mode'
    } else {
      const modeConfig = TOP_LEVEL_MODES.find(m => m.id === mode)
      title.textContent = modeConfig ? `${modeConfig.label} Mode` : mode
    }
    header.appendChild(title)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'flow-mode-explainer-close'
    closeBtn.innerHTML = CLOSE_ICON
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      hideExplainer()
    })
    header.appendChild(closeBtn)
    explainer.appendChild(header)

    // Body
    const body = document.createElement('div')
    body.className = 'flow-mode-explainer-body'

    let desc = content.description
    if (mode === 'design' && subMode) {
      const subConfig = DESIGN_SUB_MODES.find(s => s.id === subMode)
      if (subConfig) desc = subConfig.tooltip
    }
    body.textContent = desc
    explainer.appendChild(body)

    // Key hints
    const keys = content.keys
    if (keys && keys.length > 0) {
      const keysRow = document.createElement('div')
      keysRow.className = 'flow-mode-explainer-keys'
      for (const k of keys) {
        const kbd = document.createElement('kbd')
        kbd.textContent = k
        keysRow.appendChild(kbd)
      }
      explainer.appendChild(keysRow)
    }

    container.appendChild(explainer)

    // Auto-dismiss
    dismissTimer = setTimeout(hideExplainer, AUTO_DISMISS_MS)
  }

  function hideExplainer() {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
    if (explainer) {
      explainer.remove()
      explainer = null
    }
  }

  function update(state: ModeState) {
    const { topLevel, designSubMode } = state

    if (topLevel === 'default') {
      container.toggleAttribute('data-hidden', true)
      hideExplainer()
      currentMode = null
      return
    }

    container.removeAttribute('data-hidden')

    // Update pill
    const modeConfig = TOP_LEVEL_MODES.find(m => m.id === topLevel)
    if (topLevel === 'design' && designSubMode) {
      const subConfig = DESIGN_SUB_MODES.find(s => s.id === designSubMode)
      pillLabel.textContent = subConfig ? `${subConfig.label}` : 'Design'
      pillKey.textContent = subConfig ? subConfig.key : 'D'
    } else {
      pillLabel.textContent = modeConfig?.label ?? topLevel
      pillKey.textContent = modeConfig?.hotkey?.toUpperCase() ?? ''
    }

    // Show explainer on mode change (not on sub-mode change within same mode)
    const modeChanged = currentMode !== topLevel
    currentMode = topLevel

    if (modeChanged) {
      showExplainer(topLevel, designSubMode)
    }
  }

  function destroy() {
    hideExplainer()
    container.remove()
    styleEl.remove()
  }

  return { update, destroy }
}
