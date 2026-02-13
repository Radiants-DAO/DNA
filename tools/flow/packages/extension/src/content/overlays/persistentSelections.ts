import { ensureOverlayRoot, getOverlayShadow } from './overlayRoot';
import { generateSelector } from '../elementRegistry';

interface SelectionEntry {
  selector: string;
  elementRef?: WeakRef<Element>;
  outline: HTMLDivElement;
}

const STYLE_ID = '__flow-persistent-selection-style__';
const CONTAINER_ID = '__flow-persistent-selection-container__';

const entries = new Map<string, SelectionEntry>();
let container: HTMLDivElement | null = null;
let repositionScheduled = false;
let listenersAttached = false;
let observer: MutationObserver | null = null;
const handleViewportChange = () => scheduleReposition();

function ensureContainer(): HTMLDivElement {
  if (container) return container;

  const shadow = getOverlayShadow() ?? ensureOverlayRoot();
  if (!shadow.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483646;
      }

      .flow-persistent-selection-outline {
        position: fixed;
        border: 2px solid rgba(59, 130, 246, 0.95);
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.08);
        box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.8);
        pointer-events: none;
        display: none;
      }

      .flow-persistent-selection-outline.pulse {
        animation: flowPersistentSelectionPulse 850ms ease-out;
      }

      @keyframes flowPersistentSelectionPulse {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.75), inset 0 0 0 1px rgba(191, 219, 254, 1);
        }
        100% {
          box-shadow: 0 0 0 18px rgba(59, 130, 246, 0), inset 0 0 0 1px rgba(191, 219, 254, 0.8);
        }
      }
    `;
    shadow.appendChild(style);
  }

  container = document.createElement('div');
  container.id = CONTAINER_ID;
  shadow.appendChild(container);

  attachRepositionListeners();
  scheduleReposition();

  return container;
}

function attachRepositionListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('scroll', handleViewportChange, { passive: true });
  window.addEventListener('resize', handleViewportChange, { passive: true });

  observer = new MutationObserver(handleViewportChange);
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }
}

function detachRepositionListeners(): void {
  if (!listenersAttached) return;
  listenersAttached = false;
  window.removeEventListener('scroll', handleViewportChange);
  window.removeEventListener('resize', handleViewportChange);
  observer?.disconnect();
  observer = null;
}

function querySelectorSafely(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function positionEntry(entry: SelectionEntry): void {
  const existing = entry.elementRef?.deref();
  const element = existing ?? querySelectorSafely(entry.selector);
  if (!element) {
    entry.outline.style.display = 'none';
    return;
  }
  entry.elementRef = new WeakRef(element);

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    entry.outline.style.display = 'none';
    return;
  }
  entry.outline.style.top = `${rect.top}px`;
  entry.outline.style.left = `${rect.left}px`;
  entry.outline.style.width = `${rect.width}px`;
  entry.outline.style.height = `${rect.height}px`;
  entry.outline.style.display = 'block';
}

function repositionNow(): void {
  repositionScheduled = false;
  for (const entry of entries.values()) {
    positionEntry(entry);
  }
}

function scheduleReposition(): void {
  if (repositionScheduled) return;
  repositionScheduled = true;
  requestAnimationFrame(repositionNow);
}

export function addPersistentSelection(element: Element, selector = generateSelector(element)): string {
  const root = ensureContainer();
  let entry = entries.get(selector);
  if (!entry) {
    const outline = document.createElement('div');
    outline.className = 'flow-persistent-selection-outline';
    outline.dataset.selector = selector;
    root.appendChild(outline);
    entry = {
      selector,
      elementRef: new WeakRef(element),
      outline,
    };
    entries.set(selector, entry);
  } else {
    entry.elementRef = new WeakRef(element);
  }

  positionEntry(entry);
  return selector;
}

export function addPersistentSelectionBySelector(selector: string): Element | null {
  const element = querySelectorSafely(selector);
  if (element) {
    addPersistentSelection(element, selector);
    return element;
  }

  const root = ensureContainer();
  if (!entries.has(selector)) {
    const outline = document.createElement('div');
    outline.className = 'flow-persistent-selection-outline';
    outline.dataset.selector = selector;
    outline.style.display = 'none';
    root.appendChild(outline);
    entries.set(selector, { selector, outline });
  }
  scheduleReposition();
  return null;
}

export function pulsePersistentSelection(selector: string): void {
  const entry = entries.get(selector);
  if (!entry) return;
  entry.outline.classList.remove('pulse');
  // Force reflow so repeated pulse clicks animate.
  void entry.outline.offsetWidth;
  entry.outline.classList.add('pulse');
}

export function clearPersistentSelections(): void {
  for (const entry of entries.values()) {
    entry.outline.remove();
  }
  entries.clear();
}

export function getPersistentSelectionSelectors(): string[] {
  return [...entries.keys()];
}

export function destroyPersistentSelections(): void {
  clearPersistentSelections();
  detachRepositionListeners();
  container?.remove();
  container = null;
}
