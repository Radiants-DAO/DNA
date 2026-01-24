/**
 * DOM Annotator Tests
 *
 * Tests for data-radflow-id attribute injection, cleanup,
 * batching, and MutationObserver functionality.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  annotateElement,
  annotateElementSync,
  removeAnnotation,
  removeAnnotationSync,
  getIdFromElement,
  findElementById,
  isElementTracked,
  getTrackedId,
  startMutationObserver,
  stopMutationObserver,
  isMutationObserverActive,
  flushPendingOperations,
  resetAnnotator,
  RADFLOW_ID_ATTR,
} from '../dom-annotator.js';

describe('DOM Annotator', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a container for test elements
    container = document.createElement('div');
    document.body.appendChild(container);

    // Reset annotator state
    resetAnnotator();
  });

  afterEach(() => {
    // Cleanup
    resetAnnotator();
    container.remove();
    vi.restoreAllMocks();
  });

  describe('annotateElementSync', () => {
    it('should inject data-radflow-id attribute on element', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_test123');

      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBe('rf_test123');
    });

    it('should track the element internally', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_test123');

      expect(isElementTracked(element)).toBe(true);
      expect(getTrackedId(element)).toBe('rf_test123');
    });

    it('should overwrite existing annotation', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_old');
      annotateElementSync(element, 'rf_new');

      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBe('rf_new');
      expect(getTrackedId(element)).toBe('rf_new');
    });
  });

  describe('removeAnnotationSync', () => {
    it('should remove data-radflow-id attribute from element', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_test123');
      removeAnnotationSync(element);

      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBeNull();
    });

    it('should remove element from tracking', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_test123');
      removeAnnotationSync(element);

      expect(isElementTracked(element)).toBe(false);
      expect(getTrackedId(element)).toBeUndefined();
    });
  });

  describe('getIdFromElement', () => {
    it('should return the radflow id if present', () => {
      const element = document.createElement('div');
      element.setAttribute(RADFLOW_ID_ATTR, 'rf_test123');
      container.appendChild(element);

      expect(getIdFromElement(element)).toBe('rf_test123');
    });

    it('should return null if no radflow id', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      expect(getIdFromElement(element)).toBeNull();
    });
  });

  describe('findElementById', () => {
    it('should find element by radflow id', () => {
      const element = document.createElement('div');
      container.appendChild(element);
      annotateElementSync(element, 'rf_findme');

      const found = findElementById('rf_findme');
      expect(found).toBe(element);
    });

    it('should return null if element not found', () => {
      const found = findElementById('rf_nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('batched operations', () => {
    it('should batch multiple annotate calls', async () => {
      const elements = Array.from({ length: 5 }, () => {
        const el = document.createElement('div');
        container.appendChild(el);
        return el;
      });

      // Annotate all elements (batched)
      elements.forEach((el, i) => {
        annotateElement(el, `rf_${i}`);
      });

      // Before flush, attributes should not be set yet
      // (they're queued for next animation frame)
      // Note: in jsdom, requestAnimationFrame is synchronous, so we need to flush

      flushPendingOperations();

      // After flush, all attributes should be set
      elements.forEach((el, i) => {
        expect(el.getAttribute(RADFLOW_ID_ATTR)).toBe(`rf_${i}`);
      });
    });

    it('should skip annotation if element already has same id', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      // First annotation
      annotateElementSync(element, 'rf_same');

      // Spy on setAttribute
      const setAttrSpy = vi.spyOn(element, 'setAttribute');

      // Second annotation with same id (batched)
      annotateElement(element, 'rf_same');
      flushPendingOperations();

      // Should not have called setAttribute again
      expect(setAttrSpy).not.toHaveBeenCalled();
    });

    it('should batch remove operations', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_test');

      // Remove (batched)
      removeAnnotation(element);

      // Before flush, attribute should still be present
      // Note: jsdom may handle this differently

      flushPendingOperations();

      // After flush, attribute should be removed
      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBeNull();
      expect(isElementTracked(element)).toBe(false);
    });

    it('should skip remove if element not tracked', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      // Try to remove from untracked element
      removeAnnotation(element);
      flushPendingOperations();

      // No error should occur
      expect(isElementTracked(element)).toBe(false);
    });
  });

  describe('MutationObserver', () => {
    it('should start and stop observer', () => {
      expect(isMutationObserverActive()).toBe(false);

      startMutationObserver();
      expect(isMutationObserverActive()).toBe(true);

      stopMutationObserver();
      expect(isMutationObserverActive()).toBe(false);
    });

    it('should not start multiple observers', () => {
      startMutationObserver();
      startMutationObserver(); // Should be a no-op

      expect(isMutationObserverActive()).toBe(true);

      stopMutationObserver();
      expect(isMutationObserverActive()).toBe(false);
    });

    it('should re-apply attribute if removed externally', async () => {
      const element = document.createElement('div');
      container.appendChild(element);

      // Annotate element
      annotateElementSync(element, 'rf_protected');

      // Start observer
      startMutationObserver();

      // Externally remove the attribute
      element.removeAttribute(RADFLOW_ID_ATTR);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Attribute should be re-applied
      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBe('rf_protected');
    });

    it('should call onMutation callback when nodes are added', async () => {
      const onMutation = vi.fn();

      startMutationObserver(onMutation);

      // Add a new element
      const newElement = document.createElement('div');
      container.appendChild(newElement);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onMutation).toHaveBeenCalled();
    });

    it('should cleanup tracking when nodes are removed', async () => {
      const element = document.createElement('div');
      container.appendChild(element);

      annotateElementSync(element, 'rf_cleanup');
      expect(isElementTracked(element)).toBe(true);

      startMutationObserver();

      // Remove the element
      element.remove();

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Element should no longer be tracked
      expect(isElementTracked(element)).toBe(false);
    });

    it('should cleanup nested tracked elements when parent is removed', async () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);
      container.appendChild(parent);

      annotateElementSync(parent, 'rf_parent');
      annotateElementSync(child, 'rf_child');

      expect(isElementTracked(parent)).toBe(true);
      expect(isElementTracked(child)).toBe(true);

      startMutationObserver();

      // Remove parent (which contains child)
      parent.remove();

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Both should no longer be tracked
      expect(isElementTracked(parent)).toBe(false);
      expect(isElementTracked(child)).toBe(false);
    });
  });

  describe('resetAnnotator', () => {
    it('should stop observer and clear pending operations', () => {
      startMutationObserver();

      const element = document.createElement('div');
      container.appendChild(element);

      // Queue some operations
      annotateElement(element, 'rf_pending');

      // Reset
      resetAnnotator();

      expect(isMutationObserverActive()).toBe(false);

      // After reset, pending operations should be cleared
      // so this element won't be annotated
      flushPendingOperations();
      expect(element.getAttribute(RADFLOW_ID_ATTR)).toBeNull();
    });
  });
});
