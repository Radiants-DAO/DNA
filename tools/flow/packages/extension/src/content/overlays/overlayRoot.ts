import styles from './overlayStyles.css?inline';
import { isEditableElement } from '../features/keyboardGuards';

let rootInstance: HTMLElement | null = null;
let shadowInstance: ShadowRoot | null = null;

/**
 * Ensure the overlay root exists in the document.
 * Creates a custom element with a closed shadow DOM to isolate overlay styles.
 * Returns the shadow root for appending overlay elements.
 */
export function ensureOverlayRoot(): ShadowRoot {
  if (shadowInstance) return shadowInstance;

  const existingRoots = document.querySelectorAll('flow-overlay-root');
  existingRoots.forEach((el) => el.remove());

  rootInstance = document.createElement('flow-overlay-root');
  shadowInstance = rootInstance.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = styles;
  shadowInstance.appendChild(style);

  // Prevent global mode/design shortcuts while typing in overlay inputs.
  shadowInstance.addEventListener('keydown', (event) => {
    if (isEditableElement(event.target)) {
      event.stopPropagation();
    }
  });

  // Position fixed, full viewport, no pointer events
  rootInstance.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;

  document.documentElement.appendChild(rootInstance);

  return shadowInstance;
}

/**
 * Get the shadow root if it exists.
 */
export function getOverlayShadow(): ShadowRoot | null {
  return shadowInstance;
}

/**
 * Get the overlay host element (for setting attributes like data-theme).
 */
export function getOverlayHost(): HTMLElement | null {
  return rootInstance;
}

/**
 * Remove the overlay root from the document.
 */
export function removeOverlayRoot(): void {
  if (rootInstance) {
    rootInstance.remove();
    rootInstance = null;
    shadowInstance = null;
  }
}
