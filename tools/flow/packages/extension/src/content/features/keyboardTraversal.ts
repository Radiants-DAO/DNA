/**
 * Keyboard element traversal — Tab/Shift+Tab through siblings,
 * Enter into children, Shift+Enter to parent.
 *
 * Following VisBug's traversal pattern from selectable.js.
 */

/** Next element sibling, wrapping to first at end. */
export function getNextSibling(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent) return null
  const siblings = Array.from(parent.children)
  if (siblings.length <= 1) return null
  const idx = siblings.indexOf(el)
  return siblings[(idx + 1) % siblings.length]
}

/** Previous element sibling, wrapping to last at start. */
export function getPrevSibling(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent) return null
  const siblings = Array.from(parent.children)
  if (siblings.length <= 1) return null
  const idx = siblings.indexOf(el)
  return siblings[(idx - 1 + siblings.length) % siblings.length]
}

/** First element child, or null for leaf elements. */
export function getFirstChild(el: Element): Element | null {
  return el.firstElementChild
}

/** Parent element, or null at body/html. */
export function getParent(el: Element): Element | null {
  const parent = el.parentElement
  if (!parent || parent === document.documentElement || parent === document.body) return null
  return parent
}
