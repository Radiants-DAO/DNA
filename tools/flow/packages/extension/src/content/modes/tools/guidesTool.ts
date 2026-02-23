import { createInspectRuler, type InspectRuler } from './inspectRuler'
import styles from './guidesTool.css?inline'

export interface GuidesToolOptions {
  shadowRoot: ShadowRoot
}

export interface GuidesTool {
  activate: () => void
  deactivate: () => void
  onHover: (element: Element) => void
  onSelect: (element: Element) => void
  destroy: () => void
}

export function createGuidesTool({ shadowRoot }: GuidesToolOptions): GuidesTool {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const container = document.createElement('div')
  container.className = 'flow-guides-container'
  shadowRoot.appendChild(container)

  const ruler: InspectRuler = createInspectRuler({ shadowRoot })
  let anchor: Element | null = null
  let guideEls: HTMLElement[] = []
  let badgeEl: HTMLElement | null = null

  function clearGuides(): void {
    for (const el of guideEls) el.remove()
    guideEls = []
    badgeEl?.remove()
    badgeEl = null
  }

  function renderCrosshairGuides(el: Element): void {
    clearGuides()
    const rect = el.getBoundingClientRect()

    // Top edge
    const top = document.createElement('div')
    top.className = 'flow-guide-line flow-guide-line--horizontal'
    top.style.top = `${rect.top}px`
    shadowRoot.appendChild(top)
    guideEls.push(top)

    // Bottom edge
    const bottom = document.createElement('div')
    bottom.className = 'flow-guide-line flow-guide-line--horizontal'
    bottom.style.top = `${rect.bottom}px`
    shadowRoot.appendChild(bottom)
    guideEls.push(bottom)

    // Left edge
    const left = document.createElement('div')
    left.className = 'flow-guide-line flow-guide-line--vertical'
    left.style.left = `${rect.left}px`
    shadowRoot.appendChild(left)
    guideEls.push(left)

    // Right edge
    const right = document.createElement('div')
    right.className = 'flow-guide-line flow-guide-line--vertical'
    right.style.left = `${rect.right}px`
    shadowRoot.appendChild(right)
    guideEls.push(right)

    // Anchor badge
    badgeEl = document.createElement('div')
    badgeEl.className = 'flow-guide-anchor-badge'
    badgeEl.textContent = `${Math.round(rect.width)}\u00D7${Math.round(rect.height)}`
    badgeEl.style.left = `${rect.right + 4}px`
    badgeEl.style.top = `${rect.top}px`
    shadowRoot.appendChild(badgeEl)
  }

  return {
    activate() {
      // Nothing to do on activate — tool is passive until selection
    },

    deactivate() {
      anchor = null
      clearGuides()
      ruler.clear()
    },

    onHover(element: Element) {
      if (!anchor) return
      // When hovering back to anchor, clear stale measurement lines
      if (anchor === element) {
        ruler.clearLines()
        return
      }
      ruler.measureTo(element)
    },

    onSelect(element: Element) {
      anchor = element
      ruler.setAnchor(element)
      renderCrosshairGuides(element)
    },

    destroy() {
      clearGuides()
      ruler.destroy()
      container.remove()
      styleEl.remove()
    },
  }
}
