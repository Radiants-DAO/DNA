import { computeMeasurements, type Measurement } from '../../measurements/measurements'
import { createDistanceOverlay, createMeasurementLine } from '../../measurements/distanceOverlay'
import styles from './inspectRuler.css?inline'

export interface InspectRulerOptions {
  shadowRoot: ShadowRoot
}

export interface InspectRuler {
  setAnchor: (element: Element) => void
  measureTo: (element: Element) => void
  clearLines: () => void
  clear: () => void
  destroy: () => void
}

export function createInspectRuler({ shadowRoot }: InspectRulerOptions): InspectRuler {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const container = document.createElement('div')
  container.className = 'flow-inspect-ruler'
  shadowRoot.appendChild(container)

  let anchor: Element | null = null
  let overlays: HTMLElement[] = []

  function clearOverlays(): void {
    for (const el of overlays) el.remove()
    overlays = []
  }

  function renderMeasurements(measurements: Measurement[]): void {
    clearOverlays()
    for (const m of measurements) {
      if (m.d <= 0) continue
      const label = createDistanceOverlay(m)
      const line = createMeasurementLine(m)
      container.appendChild(label)
      container.appendChild(line)
      overlays.push(label, line)
    }
  }

  return {
    setAnchor(element: Element) {
      anchor = element
    },

    measureTo(element: Element) {
      if (!anchor || anchor === element) {
        clearOverlays()
        return
      }
      const a = anchor.getBoundingClientRect()
      const b = element.getBoundingClientRect()
      const measurements = computeMeasurements(a, b)
      renderMeasurements(measurements)
    },

    clearLines() {
      clearOverlays()
    },

    clear() {
      anchor = null
      clearOverlays()
    },

    destroy() {
      clearOverlays()
      container.remove()
      styleEl.remove()
    },
  }
}
