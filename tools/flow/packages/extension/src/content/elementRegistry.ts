/**
 * ElementRegistry - Assigns stable numeric IDs to DOM elements for agent lookups.
 *
 * Sets `data-flow-index` attribute on registered elements, enabling the agent
 * script (running in MAIN world) to locate elements by index.
 */

export interface SelectedMeta {
  elementIndex: number;
  selector: string;
  rect: { top: number; left: number; width: number; height: number };
}

export type SelectCallback = (element: Element, meta: SelectedMeta) => void;

class ElementRegistry {
  private nextId = 1;
  private elementToId = new WeakMap<Element, number>();
  private idToElement = new Map<number, WeakRef<Element>>();

  /**
   * Register an element and assign it a stable numeric ID.
   * Sets `data-flow-index` attribute on the element.
   */
  register(element: Element): number {
    // Return existing ID if already registered
    const existingId = this.elementToId.get(element);
    if (existingId !== undefined) {
      return existingId;
    }

    const id = this.nextId++;
    this.elementToId.set(element, id);
    this.idToElement.set(id, new WeakRef(element));
    element.setAttribute('data-flow-index', String(id));

    return id;
  }

  /**
   * Unregister an element and clean up its `data-flow-index` attribute.
   */
  unregister(element: Element): void {
    const id = this.elementToId.get(element);
    if (id === undefined) return;

    this.elementToId.delete(element);
    this.idToElement.delete(id);
    element.removeAttribute('data-flow-index');
  }

  /**
   * Get the ID for a registered element, or undefined if not registered.
   */
  getId(element: Element): number | undefined {
    return this.elementToId.get(element);
  }

  /**
   * Get an element by its ID, or undefined if not found or garbage collected.
   */
  getElement(id: number): Element | undefined {
    const ref = this.idToElement.get(id);
    return ref?.deref();
  }

  /**
   * Check if an element is registered.
   */
  has(element: Element): boolean {
    return this.elementToId.has(element);
  }

  /**
   * Clear all registrations and remove all `data-flow-index` attributes.
   */
  clear(): void {
    for (const [id, ref] of this.idToElement) {
      const element = ref.deref();
      if (element) {
        element.removeAttribute('data-flow-index');
      }
    }
    this.idToElement.clear();
    this.nextId = 1;
  }
}

// Singleton instance
export const elementRegistry = new ElementRegistry();

/**
 * Generate a CSS selector for an element.
 * Prioritizes: id > unique class > nth-child path
 */
export function generateSelector(element: Element): string {
  // Use ID if available
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Try unique class combination
  if (element.classList.length > 0) {
    const classes = [...element.classList].map((c) => `.${CSS.escape(c)}`).join('');
    const selector = `${element.tagName.toLowerCase()}${classes}`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Fall back to nth-child path
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    const parent = current.parentElement;
    if (!parent) break;

    const siblings = [...parent.children].filter(
      (child) => child.tagName === current!.tagName
    );
    const index = siblings.indexOf(current) + 1;

    const tag = current.tagName.toLowerCase();
    if (siblings.length > 1) {
      path.unshift(`${tag}:nth-of-type(${index})`);
    } else {
      path.unshift(tag);
    }

    current = parent;
  }

  return path.join(' > ');
}

/**
 * Create selection metadata for an element.
 */
export function createSelectedMeta(element: Element, elementIndex: number): SelectedMeta {
  const rect = element.getBoundingClientRect();
  return {
    elementIndex,
    selector: generateSelector(element),
    rect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}

/**
 * Dispatch element-selected custom event.
 */
export function dispatchElementSelected(meta: SelectedMeta): void {
  window.dispatchEvent(
    new CustomEvent('flow:content:element-selected', {
      detail: meta,
    })
  );
}
