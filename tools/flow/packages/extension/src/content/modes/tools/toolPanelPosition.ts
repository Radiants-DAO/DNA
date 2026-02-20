/**
 * Shared tool panel positioning utility.
 *
 * Places the panel near the target element, avoiding overlap with other
 * persistently selected elements. All 6 design tools delegate here.
 *
 * Placement strategy (in priority order):
 * 1. Below the target element
 * 2. Above the target element
 * 3. Right of the target element
 * 4. Left of the target element
 *
 * Each candidate is checked against the viewport bounds and all other
 * selection rects. The first candidate that doesn't overlap wins.
 * If all overlap, the candidate with the least overlap area is used.
 */

import { getPersistentSelectionSelectors } from '../../overlays/persistentSelections'

const MARGIN = 8

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  )
}

function overlapArea(a: Rect, b: Rect): number {
  const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left))
  const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top))
  return overlapX * overlapY
}

function clamp(left: number, top: number, pw: number, ph: number): { left: number; top: number } {
  return {
    left: Math.max(MARGIN, Math.min(left, window.innerWidth - pw - MARGIN)),
    top: Math.max(MARGIN, Math.min(top, window.innerHeight - ph - MARGIN)),
  }
}

function getOtherSelectionRects(targetEl: Element): Rect[] {
  const rects: Rect[] = []
  for (const sel of getPersistentSelectionSelectors()) {
    const el = document.querySelector(sel)
    if (!el || el === targetEl) continue
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      rects.push({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
  }
  return rects
}

/**
 * Compute the best position for a tool panel near `targetEl`.
 * Returns `{ left, top }` in viewport pixels.
 */
export function computeToolPanelPosition(
  targetEl: Element,
  panelWidth: number,
  panelHeight: number,
): { left: number; top: number } {
  const rect = targetEl.getBoundingClientRect()
  const otherRects = getOtherSelectionRects(targetEl)

  // Generate candidates: below, above, right, left
  const candidates = [
    clamp(rect.left, rect.bottom + MARGIN, panelWidth, panelHeight),           // below
    clamp(rect.left, rect.top - panelHeight - MARGIN, panelWidth, panelHeight), // above
    clamp(rect.right + MARGIN, rect.top, panelWidth, panelHeight),             // right
    clamp(rect.left - panelWidth - MARGIN, rect.top, panelWidth, panelHeight), // left
  ]

  if (otherRects.length === 0) {
    return candidates[0]
  }

  // Score each candidate by total overlap with other selections
  let bestCandidate = candidates[0]
  let bestOverlap = Infinity

  for (const cand of candidates) {
    const panelRect: Rect = { top: cand.top, left: cand.left, width: panelWidth, height: panelHeight }
    let totalOverlap = 0
    for (const other of otherRects) {
      totalOverlap += overlapArea(panelRect, other)
    }
    if (totalOverlap === 0) {
      return cand // No overlap — use immediately
    }
    if (totalOverlap < bestOverlap) {
      bestOverlap = totalOverlap
      bestCandidate = cand
    }
  }

  return bestCandidate
}
