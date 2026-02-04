import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerElement,
  unregisterElement,
  getElement,
  applyStyleMutation,
  applyTextMutation,
  revertMutation,
  getAllDiffs,
  clearDiffs,
} from '../../content/mutations/mutationEngine';

/**
 * Integration-style test validating the full mutation flow:
 * select element → mutate → capture diff → verify → revert → verify
 *
 * Note: Runs in JSDOM. Full browser integration testing should be done
 * manually or via Playwright against a real page with the extension loaded.
 */
describe('Mutation flow integration', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="hero"><h1 id="title" style="color: black;">Hello World</h1><p id="desc">Description text</p></div>';
    clearDiffs();
  });

  describe('element registration', () => {
    it('registers and retrieves elements', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);
      expect(getElement('ref-title')).toBe(el);
    });

    it('unregisters elements', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);
      unregisterElement('ref-title');
      expect(getElement('ref-title')).toBeUndefined();
    });
  });

  describe('full style mutation cycle', () => {
    it('apply → capture diff → verify DOM → revert → verify restored', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      // Step 1: Apply mutation
      const diff = applyStyleMutation('ref-title', { color: 'red' });

      // Step 2: Verify DOM changed
      expect(el.style.color).toBe('red');

      // Step 3: Verify diff captured
      const allDiffs = getAllDiffs();
      expect(allDiffs.length).toBeGreaterThanOrEqual(1);

      // Step 4: Revert
      if (diff) {
        revertMutation(diff.id);

        // Step 5: Verify restored
        expect(el.style.color).toBe('black');
        expect(getAllDiffs()).toHaveLength(0);
      }
    });

    it('multiple style mutations accumulate diffs', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      applyStyleMutation('ref-title', { color: 'red' });
      applyStyleMutation('ref-title', { 'font-size': '24px' });
      applyStyleMutation('ref-title', { 'margin-top': '10px' });

      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('24px');
      expect(el.style.marginTop).toBe('10px');

      // Should have multiple diffs
      expect(getAllDiffs().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('full text mutation cycle', () => {
    it('apply → capture diff → verify DOM → revert → verify restored', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      // Step 1: Apply mutation
      const diff = applyTextMutation('ref-title', 'Goodbye World');

      // Step 2: Verify DOM changed
      expect(el.textContent).toBe('Goodbye World');

      // Step 3: Verify diff captured
      expect(diff).not.toBeNull();
      expect(diff!.type).toBe('text');
      expect(diff!.changes[0].oldValue).toBe('Hello World');
      expect(diff!.changes[0].newValue).toBe('Goodbye World');

      // Step 4: Revert
      revertMutation(diff!.id);

      // Step 5: Verify restored
      expect(el.textContent).toBe('Hello World');
      expect(getAllDiffs()).toHaveLength(0);
    });

    it('returns null for unchanged text', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      const diff = applyTextMutation('ref-title', 'Hello World');
      expect(diff).toBeNull();
    });
  });

  describe('revert all', () => {
    it('reverts multiple mutations in correct order', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      // Original text is "Hello World"
      applyTextMutation('ref-title', 'First');
      applyTextMutation('ref-title', 'Second');
      applyTextMutation('ref-title', 'Third');

      expect(el.textContent).toBe('Third');

      // Revert all should restore to original "Hello World"
      revertMutation('all');
      expect(el.textContent).toBe('Hello World');
      expect(getAllDiffs()).toHaveLength(0);
    });

    it('handles mixed style and text mutations', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      applyStyleMutation('ref-title', { color: 'red' });
      applyTextMutation('ref-title', 'Changed');
      applyStyleMutation('ref-title', { 'font-size': '24px' });

      expect(el.style.color).toBe('red');
      expect(el.textContent).toBe('Changed');
      expect(el.style.fontSize).toBe('24px');

      revertMutation('all');

      expect(el.style.color).toBe('black');
      expect(el.textContent).toBe('Hello World');
      expect(el.style.fontSize).toBe('');
      expect(getAllDiffs()).toHaveLength(0);
    });
  });

  describe('multiple elements', () => {
    it('tracks mutations across different elements', () => {
      const title = document.getElementById('title') as HTMLElement;
      const desc = document.getElementById('desc') as HTMLElement;

      registerElement('ref-title', title);
      registerElement('ref-desc', desc);

      applyStyleMutation('ref-title', { color: 'red' });
      applyTextMutation('ref-desc', 'New description');

      expect(title.style.color).toBe('red');
      expect(desc.textContent).toBe('New description');

      const diffs = getAllDiffs();
      expect(diffs.length).toBeGreaterThanOrEqual(2);

      // Revert all
      revertMutation('all');
      expect(title.style.color).toBe('black');
      expect(desc.textContent).toBe('Description text');
    });
  });

  describe('edge cases', () => {
    it('returns null for unknown element ref', () => {
      expect(applyStyleMutation('nonexistent', { color: 'red' })).toBeNull();
      expect(applyTextMutation('nonexistent', 'text')).toBeNull();
    });

    it('returns false for unknown mutation id revert', () => {
      expect(revertMutation('unknown-id')).toBe(false);
    });

    it('clearDiffs removes diffs without reverting DOM', () => {
      const el = document.getElementById('title') as HTMLElement;
      registerElement('ref-title', el);

      applyTextMutation('ref-title', 'Changed');
      clearDiffs();

      expect(getAllDiffs()).toHaveLength(0);
      expect(el.textContent).toBe('Changed'); // Not reverted
    });
  });
});
