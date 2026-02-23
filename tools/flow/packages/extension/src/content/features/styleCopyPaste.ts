import type { UnifiedMutationEngine } from '../mutations/unifiedMutationEngine'

export interface CopiedStyle {
  property: string
  value: string
}

/**
 * Properties worth copying. Excludes inherited/layout properties
 * that would break the target element's structure.
 */
const COPY_PROPERTIES = [
  'color', 'background-color', 'background-image', 'background',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'text-transform', 'opacity', 'mix-blend-mode',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style',
  'box-shadow', 'text-shadow',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'filter', 'backdrop-filter',
]

let clipboard: CopiedStyle[] | null = null

/**
 * Copy computed styles from an element into the internal clipboard.
 * Also writes CSS text to the system clipboard for external use.
 */
export function copyStyles(el: Element): void {
  const computed = getComputedStyle(el)
  const styles: CopiedStyle[] = []

  for (const prop of COPY_PROPERTIES) {
    const val = computed.getPropertyValue(prop).trim()
    if (!val || val === 'none' || val === 'normal' || val === '0px' || val === 'auto') continue
    styles.push({ property: prop, value: val })
  }

  clipboard = styles

  // Also copy to system clipboard as CSS text
  const cssText = styles.map(s => `${s.property}: ${s.value};`).join('\n')
  navigator.clipboard.writeText(cssText).catch(() => {})
}

/**
 * Paste copied styles onto a target element, recording through the mutation engine.
 */
export function pasteStyles(el: HTMLElement, engine: UnifiedMutationEngine): void {
  if (!clipboard || clipboard.length === 0) return

  const changes: Record<string, string> = {}
  for (const { property, value } of clipboard) {
    changes[property] = value
  }
  engine.applyStyle(el, changes)
}

/**
 * Get the current internal clipboard (for testing).
 */
export function getClipboardStyles(): CopiedStyle[] | null {
  return clipboard
}
