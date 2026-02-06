import { createRoot, type Root } from 'react-dom/client';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/**
 * Mount a React root inside the given Shadow DOM.
 * The container gets pointer-events: auto so interactive elements work,
 * while the Shadow DOM host stays pointer-events: none.
 */
export function mountContentUI(shadow: ShadowRoot): HTMLDivElement {
  if (container) return container;

  container = document.createElement('div');
  container.id = 'flow-ui-root';
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;';
  shadow.appendChild(container);

  return container;
}

export function getContentRoot(): Root | null {
  return root;
}

export function getContentContainer(): HTMLDivElement | null {
  return container;
}

export function createContentRoot(container: HTMLDivElement): Root {
  if (root) return root;
  root = createRoot(container);
  return root;
}

export function unmountContentUI(): void {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
}
