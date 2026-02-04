import type { GuidesState } from './guides';

/**
 * Create a horizontal guide line element.
 */
export function createHorizontalGuide(y: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flow-guide flow-guide-horizontal';
  el.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: rgba(0, 153, 255, 0.8);
    pointer-events: none;
    z-index: 2147483645;
  `;
  return el;
}

/**
 * Create a vertical guide line element.
 */
export function createVerticalGuide(x: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'flow-guide flow-guide-vertical';
  el.style.cssText = `
    position: fixed;
    top: 0;
    left: ${x}px;
    width: 1px;
    height: 100%;
    background-color: rgba(0, 153, 255, 0.8);
    pointer-events: none;
    z-index: 2147483645;
  `;
  return el;
}

/**
 * Render guide lines into a container based on current state.
 * Clears existing guides and creates new ones based on state.
 */
export function renderGuides(container: HTMLElement | ShadowRoot, state: GuidesState): void {
  // Remove existing guides
  const existingGuides = container.querySelectorAll('.flow-guide');
  existingGuides.forEach((el) => el.remove());

  if (!state.visible) {
    return;
  }

  if (state.horizontalY !== null) {
    container.appendChild(createHorizontalGuide(state.horizontalY));
  }

  if (state.verticalX !== null) {
    container.appendChild(createVerticalGuide(state.verticalX));
  }
}
