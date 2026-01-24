/**
 * RadFlow DOM Annotator
 *
 * Injects data-radflow-id attributes onto DOM elements
 * corresponding to React components in the componentMap.
 *
 * Features:
 * - Attribute injection on component mount
 * - Cleanup on component unmount
 * - MutationObserver to re-apply attributes on dynamic content changes
 * - Batched attribute updates to avoid layout thrashing
 *
 * Implementation: fn-5.2, fn-2-gnc.12
 */

import type { RadflowId } from './types.js';

/** Attribute name for RadFlow IDs */
export const RADFLOW_ID_ATTR = 'data-radflow-id';

/** Pending attribute operations for batching */
interface AttributeOperation {
  element: HTMLElement;
  id: RadflowId | null; // null means remove
}

/** Batch queue for attribute updates */
let pendingOperations: AttributeOperation[] = [];

/** Whether a batch flush is scheduled */
let batchScheduled = false;

/** MutationObserver instance */
let mutationObserver: MutationObserver | null = null;

/** Callback to notify when attributes need re-application */
let onMutationCallback: (() => void) | null = null;

/** Set of elements being tracked (element -> radflowId) */
const trackedElements = new WeakMap<HTMLElement, RadflowId>();

/**
 * Flush pending attribute operations in a single batch.
 * Uses requestAnimationFrame to batch updates and avoid layout thrashing.
 */
function flushBatch(): void {
  if (pendingOperations.length === 0) {
    batchScheduled = false;
    return;
  }

  // Take current operations
  const operations = pendingOperations;
  pendingOperations = [];
  batchScheduled = false;

  // Apply all operations in a single frame
  for (const op of operations) {
    if (op.id === null) {
      op.element.removeAttribute(RADFLOW_ID_ATTR);
      trackedElements.delete(op.element);
    } else {
      op.element.setAttribute(RADFLOW_ID_ATTR, op.id);
      trackedElements.set(op.element, op.id);
    }
  }
}

/**
 * Schedule a batch flush if not already scheduled.
 */
function scheduleBatch(): void {
  if (!batchScheduled) {
    batchScheduled = true;
    requestAnimationFrame(flushBatch);
  }
}

/**
 * Annotate a DOM element with a RadflowId.
 * Uses batching to avoid layout thrashing when many elements are annotated.
 */
export function annotateElement(element: HTMLElement, id: RadflowId): void {
  // Check if already annotated with same ID (skip if so)
  const existingId = trackedElements.get(element);
  if (existingId === id) {
    return;
  }

  pendingOperations.push({ element, id });
  scheduleBatch();
}

/**
 * Annotate a DOM element synchronously (bypasses batching).
 * Use when immediate annotation is required (e.g., initial mount).
 */
export function annotateElementSync(element: HTMLElement, id: RadflowId): void {
  element.setAttribute(RADFLOW_ID_ATTR, id);
  trackedElements.set(element, id);
}

/**
 * Remove RadFlow annotation from an element.
 * Uses batching to avoid layout thrashing.
 */
export function removeAnnotation(element: HTMLElement): void {
  // Skip if not tracked
  if (!trackedElements.has(element)) {
    return;
  }

  pendingOperations.push({ element, id: null });
  scheduleBatch();
}

/**
 * Remove RadFlow annotation synchronously (bypasses batching).
 */
export function removeAnnotationSync(element: HTMLElement): void {
  element.removeAttribute(RADFLOW_ID_ATTR);
  trackedElements.delete(element);
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
 * Check if an element is being tracked.
 */
export function isElementTracked(element: HTMLElement): boolean {
  return trackedElements.has(element);
}

/**
 * Get the tracked RadflowId for an element from internal tracking.
 * Faster than reading from DOM attribute.
 */
export function getTrackedId(element: HTMLElement): RadflowId | undefined {
  return trackedElements.get(element);
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

// ============================================
// MutationObserver for Dynamic Content
// ============================================

/**
 * Handle MutationObserver records.
 * Re-applies attributes if they were removed by external code or framework.
 */
function handleMutations(mutations: MutationRecord[]): void {
  let needsReapplication = false;

  for (const mutation of mutations) {
    // Case 1: Attribute removed from tracked element
    if (
      mutation.type === 'attributes' &&
      mutation.attributeName === RADFLOW_ID_ATTR &&
      mutation.target instanceof HTMLElement
    ) {
      const element = mutation.target;
      const trackedId = trackedElements.get(element);
      const currentId = element.getAttribute(RADFLOW_ID_ATTR);

      // If we're tracking this element but attribute was removed/changed
      if (trackedId && currentId !== trackedId) {
        // Re-apply the attribute
        element.setAttribute(RADFLOW_ID_ATTR, trackedId);
      }
    }

    // Case 2: Nodes added - check if any need annotation
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // A node was added - React may have re-rendered
      // Notify the fiber hook to re-scan (debounced)
      needsReapplication = true;
    }

    // Case 3: Nodes removed - cleanup tracking
    if (mutation.type === 'childList') {
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          // Remove from tracking if tracked
          cleanupRemovedNode(node);
        }
      }
    }
  }

  // Notify callback if nodes were added (React may need to re-scan)
  if (needsReapplication && onMutationCallback) {
    onMutationCallback();
  }
}

/**
 * Recursively cleanup tracking for a removed node and its descendants.
 */
function cleanupRemovedNode(node: HTMLElement): void {
  trackedElements.delete(node);

  // Cleanup children
  const children = node.querySelectorAll(`[${RADFLOW_ID_ATTR}]`);
  for (const child of children) {
    if (child instanceof HTMLElement) {
      trackedElements.delete(child);
    }
  }
}

/**
 * Start the MutationObserver to watch for DOM changes.
 * Call this after the initial fiber scan is complete.
 *
 * @param onMutation - Callback when mutations suggest re-scanning is needed
 */
export function startMutationObserver(onMutation?: () => void): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }

  // Don't start if already running
  if (mutationObserver) {
    return;
  }

  onMutationCallback = onMutation ?? null;

  mutationObserver = new MutationObserver(handleMutations);

  // Observe the document body for:
  // - Attribute changes (to detect if our attributes are removed)
  // - Child list changes (to detect new/removed nodes)
  mutationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: [RADFLOW_ID_ATTR],
    childList: true,
    subtree: true,
  });

  console.log('[RadFlow] MutationObserver started');
}

/**
 * Stop the MutationObserver.
 */
export function stopMutationObserver(): void {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
    onMutationCallback = null;
    console.log('[RadFlow] MutationObserver stopped');
  }
}

/**
 * Check if the MutationObserver is running.
 */
export function isMutationObserverActive(): boolean {
  return mutationObserver !== null;
}

/**
 * Flush any pending batched operations immediately.
 * Useful before reading DOM state or in tests.
 */
export function flushPendingOperations(): void {
  flushBatch();
}

/**
 * Reset all annotator state.
 * Useful for testing or when navigating between pages.
 */
export function resetAnnotator(): void {
  stopMutationObserver();
  pendingOperations = [];
  batchScheduled = false;
  // Note: WeakMap (trackedElements) doesn't need explicit clearing
}
