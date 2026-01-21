/**
 * RadFlow Fiber Hook
 *
 * Integrates with React's __REACT_DEVTOOLS_GLOBAL_HOOK__ to intercept
 * fiber commits and build the componentMap.
 */

import type {
  ReactDevToolsHook,
  FiberRoot,
  Fiber,
  RadflowId,
  ComponentEntry,
} from './types.js';
import { getComponentMap, setEntry, clearMap, generateId } from './component-map.js';
import {
  annotateElementSync,
  removeAnnotationSync,
  generateFallbackSelectors,
  startMutationObserver,
  stopMutationObserver,
  RADFLOW_ID_ATTR,
} from './dom-annotator.js';
import { resolveSource, isNodeModulesSource } from './source-resolver.js';

/** Reference to the original onCommitFiberRoot (for chaining) */
let originalOnCommitFiberRoot: ReactDevToolsHook['onCommitFiberRoot'] | null = null;

/** Debounce timer for componentMap updates */
let updateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Callback to notify of componentMap updates */
let onMapUpdateCallback: (() => void) | null = null;

/** Fiber identity → RadflowId mapping for stable IDs across re-renders */
const fiberIdMap = new WeakMap<object, RadflowId>();

/**
 * Install the RadFlow fiber hook.
 * Chains with existing DevTools hooks (doesn't replace them).
 */
export function installFiberHook(onMapUpdate?: () => void): void {
  if (typeof window === 'undefined') return;

  onMapUpdateCallback = onMapUpdate ?? null;

  const hook = getOrCreateHook();

  // Store original for chaining
  originalOnCommitFiberRoot = hook.onCommitFiberRoot ?? null;

  // Install our hook (chains existing)
  hook.onCommitFiberRoot = (rendererID, root, priorityLevel) => {
    // Chain to existing DevTools (React DevTools, etc.)
    try {
      originalOnCommitFiberRoot?.(rendererID, root, priorityLevel);
    } catch (err) {
      console.warn('[RadFlow] Error in chained onCommitFiberRoot:', err);
    }

    // Process the fiber tree
    handleCommit(root);
  };

  // Warn if browser DevTools are open (may conflict)
  if (hook.rendererInterfaces && hook.rendererInterfaces.size > 0) {
    console.info('[RadFlow] React DevTools detected - source resolution may be enhanced');
  }

  // Start MutationObserver to re-apply attributes on dynamic content changes
  // Wait for DOM to be ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startMutationObserver(onMapUpdate);
      });
    } else {
      // DOM already loaded, start observer
      startMutationObserver(onMapUpdate);
    }
  }

  console.log('[RadFlow] Fiber hook installed');
}

/**
 * Handle a fiber root commit.
 * Called by React after each render commit.
 */
export function handleCommit(root: FiberRoot): void {
  // Debounce updates to avoid excessive processing during rapid re-renders
  if (updateDebounceTimer) {
    clearTimeout(updateDebounceTimer);
  }

  updateDebounceTimer = setTimeout(() => {
    processCommit(root);
    updateDebounceTimer = null;
  }, 100);
}

/**
 * Process a fiber tree commit (after debounce).
 */
function processCommit(root: FiberRoot): void {
  const startTime = performance.now();

  // Track which IDs we see this commit (for cleanup)
  const seenIds = new Set<RadflowId>();

  // Walk the fiber tree
  walkFiberTree(root.current, null, seenIds);

  // Remove entries for unmounted components
  const componentMap = getComponentMap();
  for (const id of componentMap.keys()) {
    if (!seenIds.has(id)) {
      const entry = componentMap.get(id);
      if (entry?.element) {
        removeAnnotationSync(entry.element);
      }
      componentMap.delete(id);
    }
  }

  const duration = performance.now() - startTime;
  if (duration > 50) {
    console.debug(`[RadFlow] Fiber tree processed in ${duration.toFixed(1)}ms`);
  }

  // Notify listeners
  onMapUpdateCallback?.();
}

/**
 * Walk the fiber tree and build componentMap entries.
 */
function walkFiberTree(
  fiber: Fiber | null,
  parentId: RadflowId | null,
  seenIds: Set<RadflowId>
): void {
  if (!fiber) return;

  let currentParentId = parentId;

  // Check if this fiber represents a user component with a DOM element
  const entry = processNode(fiber, parentId);
  if (entry) {
    seenIds.add(entry.radflowId);
    currentParentId = entry.radflowId;

    // Update parent's childIds
    if (parentId) {
      const parentEntry = getComponentMap().get(parentId);
      if (parentEntry && !parentEntry.childIds.includes(entry.radflowId)) {
        parentEntry.childIds.push(entry.radflowId);
      }
    }
  }

  // Process children
  walkFiberTree(fiber.child, currentParentId, seenIds);

  // Process siblings (same parent)
  walkFiberTree(fiber.sibling, parentId, seenIds);
}

/**
 * Process a single fiber node and create a componentMap entry if applicable.
 */
function processNode(fiber: Fiber, parentId: RadflowId | null): ComponentEntry | null {
  // Skip non-component fibers
  const componentType = getComponentType(fiber);
  if (!componentType) return null;

  // Must have a DOM element
  const element = findDOMElement(fiber);
  if (!element) return null;

  // Skip if already annotated with a different radflowId (from a different context)
  const existingId = element.getAttribute(RADFLOW_ID_ATTR);
  if (existingId && !fiberIdMap.has(fiber)) {
    // Element has ID from another fiber - skip to avoid conflicts
    return null;
  }

  // Get stable ID for this fiber (or generate new one)
  let radflowId = fiberIdMap.get(fiber);
  if (!radflowId) {
    radflowId = generateId();
    fiberIdMap.set(fiber, radflowId);
  }

  // Resolve source location
  const source = resolveSource(fiber);

  // Skip node_modules components (but mark in map with null source)
  if (isNodeModulesSource(source)) {
    // Don't add to componentMap, don't annotate DOM
    return null;
  }

  // Get component name
  const name = getComponentName(fiber);

  // Create entry
  const entry: ComponentEntry = {
    radflowId,
    name,
    displayName: getDisplayName(fiber),
    element,
    selector: `[${RADFLOW_ID_ATTR}="${radflowId}"]`,
    fallbackSelectors: generateFallbackSelectors(element),
    source,
    fiber: {
      type: componentType,
      props: sanitizeProps(fiber.memoizedProps),
      key: fiber.key,
    },
    parentId,
    childIds: [],
  };

  // Annotate DOM element synchronously (during fiber commit)
  annotateElementSync(element, radflowId);

  // Store in componentMap
  setEntry(entry);

  return entry;
}

/**
 * Get the component type for a fiber.
 * Returns null for non-component fibers (host elements, fragments, etc.).
 */
function getComponentType(fiber: Fiber): string | null {
  const type = fiber.type;

  if (typeof type === 'function') {
    // Check for class component
    if (type.prototype?.isReactComponent) {
      return 'class';
    }
    return 'function';
  }

  if (typeof type === 'object' && type !== null) {
    // Check for forwardRef
    if ('$$typeof' in type) {
      const symbolStr = type.$$typeof?.toString?.() ?? '';
      if (symbolStr.includes('forward_ref')) {
        return 'forward_ref';
      }
      if (symbolStr.includes('memo')) {
        return 'memo';
      }
    }
  }

  // Host elements (div, span, etc.) return null - we only track components
  return null;
}

/**
 * Get the display name for a component.
 */
function getComponentName(fiber: Fiber): string {
  const type = fiber.type;

  if (typeof type === 'function') {
    const fn = type as Function & { displayName?: string };
    return fn.displayName || fn.name || 'anonymous';
  }

  if (typeof type === 'object' && type !== null) {
    // Handle forwardRef, memo, etc.
    if ('displayName' in type && type.displayName) {
      return type.displayName as string;
    }
    if ('type' in type && typeof type.type === 'function') {
      return (type.type as { name?: string }).name || 'anonymous';
    }
    if ('render' in type && typeof type.render === 'function') {
      return (type.render as { name?: string }).name || 'ForwardRef';
    }
  }

  return 'anonymous';
}

/**
 * Get the displayName property from a component.
 */
function getDisplayName(fiber: Fiber): string | null {
  const type = fiber.type;

  if (typeof type === 'function') {
    const fn = type as Function & { displayName?: string };
    if (fn.displayName) return fn.displayName;
  }

  if (typeof type === 'object' && type !== null && 'displayName' in type) {
    return (type.displayName as string) || null;
  }

  return null;
}

/**
 * Find the DOM element for a fiber.
 * Traverses down if the fiber itself doesn't have a stateNode.
 */
function findDOMElement(fiber: Fiber): HTMLElement | null {
  // Check stateNode first
  if (fiber.stateNode instanceof HTMLElement) {
    return fiber.stateNode;
  }

  // For components, look at child fibers for the DOM element
  let child = fiber.child;
  while (child) {
    if (child.stateNode instanceof HTMLElement) {
      return child.stateNode;
    }
    // Go deeper if this child is also a component
    if (typeof child.type === 'function' || typeof child.type === 'object') {
      child = child.child;
    } else {
      child = null;
    }
  }

  return null;
}

/**
 * Sanitize props for storage (remove functions, React elements, etc.).
 */
function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Skip children and internal props
    if (key === 'children' || key.startsWith('__')) continue;

    // Skip functions
    if (typeof value === 'function') continue;

    // Skip React elements
    if (isReactElement(value)) continue;

    // Keep primitives and simple objects
    if (isPrimitive(value) || isSimpleObject(value)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isSimpleObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) {
    return value.every((item) => isPrimitive(item));
  }
  return Object.values(value).every((v) => isPrimitive(v));
}

function isReactElement(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$$typeof' in value &&
    typeof (value as { $$typeof: unknown }).$$typeof === 'symbol'
  );
}

/**
 * Get the existing DevTools hook or create a minimal one.
 */
export function getOrCreateHook(): ReactDevToolsHook {
  if (typeof window === 'undefined') {
    return {};
  }

  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      rendererInterfaces: new Map(),
    };
  }

  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

/**
 * Clear the componentMap and reset fiber ID tracking.
 * Useful for testing or when navigating between pages.
 */
export function resetFiberHook(): void {
  clearMap();
  stopMutationObserver();
  // Note: WeakMap doesn't need explicit clearing
}
