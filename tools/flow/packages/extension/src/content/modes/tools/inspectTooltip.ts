import { getContrastRatio, meetsWcagAA } from '../../features/accessibility'
import styles from './inspectTooltip.css?inline'

export interface InspectTooltipOptions {
  shadowRoot: ShadowRoot
}

export interface InspectTooltip {
  show: (element: Element, mouseX: number, mouseY: number) => void
  hide: () => void
  destroy: () => void
}

const TIP_PROPS = [
  'display',
  'background-color',
  'color',
  'font-size',
  'padding',
  'border-radius',
]

const COLOR_PROPS = new Set(['background-color', 'color'])

const SKIP_VALUES = new Set([
  'none', 'normal', 'auto', 'visible', '0px', 'static',
  'start', 'baseline', 'stretch', 'row', 'inline', 'block',
])

export function createInspectTooltip({ shadowRoot }: InspectTooltipOptions): InspectTooltip {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  const tip = document.createElement('div')
  tip.className = 'flow-inspect-tip'
  shadowRoot.appendChild(tip)

  function show(element: Element, mouseX: number, mouseY: number): void {
    const rect = element.getBoundingClientRect()
    const computed = getComputedStyle(element)
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const cls = element.classList.length > 0 ? `.${element.classList[0]}` : ''
    const w = Math.round(rect.width)
    const h = Math.round(rect.height)

    // ── Header ──
    let html = `<div class="flow-inspect-tip-header">
      <span>${tag}${id}${cls}</span>
      <span class="flow-inspect-tip-dims">${w}\u00d7${h}</span>
    </div>`

    // ── Styles ──
    html += '<div class="flow-inspect-tip-styles">'
    for (const prop of TIP_PROPS) {
      const val = computed.getPropertyValue(prop).trim()
      if (!val || SKIP_VALUES.has(val)) continue
      const isColor = COLOR_PROPS.has(prop)
      const swatch = isColor
        ? `<span class="flow-inspect-tip-swatch" style="background:${val}"></span>`
        : ''
      const label = prop.replace('background-', 'bg-')
      html += `<div class="flow-inspect-tip-row">
        <span class="flow-inspect-tip-prop">${label}</span>
        <span class="flow-inspect-tip-val">${swatch}${val}</span>
      </div>`
    }
    html += '</div>'

    // ── Footer: contrast + ARIA ──
    const fgColor = computed.getPropertyValue('color').trim()
    const bgColor = computed.getPropertyValue('background-color').trim()
    const parts: string[] = []

    if (fgColor && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      try {
        const ratio = getContrastRatio(fgColor, bgColor)
        const passes = meetsWcagAA(fgColor, bgColor)
        const badgeCls = passes ? 'pass' : 'fail'
        const icon = passes ? '\u2713' : '\u2717'
        parts.push(`<span class="flow-inspect-tip-badge ${badgeCls}">AA ${icon} ${ratio.toFixed(1)}:1</span>`)
      } catch { /* non-parseable colors */ }
    }

    const role = element.getAttribute('role')
    if (role) parts.push(`role=${role}`)

    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) parts.push(`"${ariaLabel.slice(0, 20)}"`)

    if (parts.length > 0) {
      html += `<div class="flow-inspect-tip-footer">${parts.join(' \u00b7 ')}</div>`
    }

    tip.innerHTML = html
    tip.style.display = ''

    // ── Quadrant-aware positioning (VisBug pattern) ──
    const north = mouseY > window.innerHeight / 2
    const west = mouseX > window.innerWidth / 2
    const tipW = tip.offsetWidth
    const tipH = tip.offsetHeight

    tip.style.top = `${north ? mouseY - tipH - 16 : mouseY + 20}px`
    tip.style.left = `${west ? mouseX - tipW + 16 : mouseX - 16}px`
  }

  function hide(): void {
    tip.style.display = 'none'
  }

  function destroy(): void {
    tip.remove()
    styleEl.remove()
  }

  return { show, hide, destroy }
}
