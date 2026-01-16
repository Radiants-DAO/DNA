/**
 * RadFlow DOM Annotator
 *
 * Injects data-radflow-id attributes onto DOM elements
 * corresponding to React components in the componentMap.
 *
 * Implementation: fn-5.2
 */

import type { RadflowId } from './types.js';

/** Attribute name for RadFlow IDs */
export const RADFLOW_ID_ATTR = 'data-radflow-id';

/**
 * Annotate a DOM element with a RadflowId.
 */
export function annotateElement(element: HTMLElement, id: RadflowId): void {
  element.setAttribute(RADFLOW_ID_ATTR, id);
}

/**
 * Remove RadFlow annotation from an element.
 */
export function removeAnnotation(element: HTMLElement): void {
  element.removeAttribute(RADFLOW_ID_ATTR);
}

/**
 * Get the RadflowId from an element, if present.
 */
export function getIdFromElement(element: HTMLElement): RadflowId | null {
  return element.getAttribute(RADFLOW_ID_ATTR);
}

/**
 * Find an element by its RadflowId.
 */
export function findElementById(id: RadflowId): HTMLElement | null {
  return document.querySelector(`[${RADFLOW_ID_ATTR}="${id}"]`);
}

/**
 * Generate fallback selectors for an element.
 * Used for agent/LLM targeting resilience when radflowId changes.
 */
export function generateFallbackSelectors(element: HTMLElement): string[] {
  const selectors: string[] = [];

  // aria-label selector
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    selectors.push(`${element.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`);
  }

  // role selector
  const role = element.getAttribute('role');
  if (role) {
    selectors.push(`${element.tagName.toLowerCase()}[role="${role}"]`);
  }

  // className selector (first class only, for stability)
  if (element.classList.length > 0) {
    const firstClass = element.classList[0];
    // Only use if it looks like a meaningful class (not utility classes)
    if (firstClass && !firstClass.match(/^(p|m|w|h|flex|grid|text|bg|border)-/)) {
      selectors.push(`.${firstClass}`);
    }
  }

  // id selector (if present and not dynamically generated)
  if (element.id && !element.id.match(/^(:|react-|__)/)) {
    selectors.push(`#${element.id}`);
  }

  return selectors;
}
