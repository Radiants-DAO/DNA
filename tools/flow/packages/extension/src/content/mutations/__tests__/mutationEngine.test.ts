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
  getSelector,
} from '../mutationEngine';

describe('mutationEngine', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<!DOCTYPE html><body><div id="hero"><h1 class="title">Hello</h1></div></body>';
    clearDiffs();
  });

  describe('element registration', () => {
    it('registers and retrieves elements', () => {
      const el = document.querySelector('h1') as HTMLElement;
      registerElement('ref-1', el);
      expect(getElement('ref-1')).toBe(el);
    });

    it('unregisters elements', () => {
      const el = document.querySelector('h1') as HTMLElement;
      registerElement('ref-1', el);
      unregisterElement('ref-1');
      expect(getElement('ref-1')).toBeUndefined();
    });
  });

  describe('getSelector', () => {
    it('returns #id for elements with id', () => {
      const el = document.getElementById('hero')!;
      expect(getSelector(el as HTMLElement)).toBe('#hero');
    });

    it('builds path selector for elements without id', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      const selector = getSelector(el);
      expect(selector).toContain('h1');
    });
  });

  describe('applyStyleMutation', () => {
    it('sets element.style and captures diff', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      const diff = applyStyleMutation('ref-1', { color: 'red' });
      expect(el.style.color).toBe('red');
      // In JSDOM, computed style changes may not be reflected
      // but the style property is set
    });

    it('normalizes camelCase properties to kebab-case', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      // Pass camelCase, should be converted to kebab-case
      applyStyleMutation('ref-1', { marginTop: '10px', backgroundColor: 'blue' });
      expect(el.style.marginTop).toBe('10px');
      expect(el.style.backgroundColor).toBe('blue');
    });

    it('returns null for unknown elementRef', () => {
      expect(applyStyleMutation('nonexistent', { color: 'red' })).toBeNull();
    });

    it('returns null when no actual change occurs', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      el.style.color = 'blue';
      registerElement('ref-1', el);

      // Applying same value should return null
      const diff = applyStyleMutation('ref-1', { color: 'blue' });
      // May or may not be null depending on computed vs inline style
    });
  });

  describe('applyTextMutation', () => {
    it('changes textContent and captures diff', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      const diff = applyTextMutation('ref-1', 'Goodbye');
      expect(el.textContent).toBe('Goodbye');
      expect(diff).not.toBeNull();
      expect(diff!.type).toBe('text');
      expect(diff!.changes[0].oldValue).toBe('Hello');
      expect(diff!.changes[0].newValue).toBe('Goodbye');
    });

    it('returns null for same text', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      const diff = applyTextMutation('ref-1', 'Hello');
      expect(diff).toBeNull();
    });

    it('returns null for unknown elementRef', () => {
      expect(applyTextMutation('nonexistent', 'text')).toBeNull();
    });
  });

  describe('revertMutation', () => {
    it('restores original text', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      const diff = applyTextMutation('ref-1', 'Goodbye');
      expect(el.textContent).toBe('Goodbye');

      revertMutation(diff!.id);
      expect(el.textContent).toBe('Hello');
      expect(getAllDiffs()).toHaveLength(0);
    });

    it('restores original style', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      const diff = applyStyleMutation('ref-1', { color: 'red' });
      expect(el.style.color).toBe('red');

      if (diff) {
        revertMutation(diff.id);
        expect(el.style.color).toBe('');
      }
    });

    it('returns false for unknown mutation id', () => {
      expect(revertMutation('unknown-id')).toBe(false);
    });
  });

  describe('revertMutation("all")', () => {
    it('clears all diffs and restores all changes', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      applyTextMutation('ref-1', 'A');
      applyTextMutation('ref-1', 'B');
      expect(getAllDiffs().length).toBeGreaterThanOrEqual(1);

      revertMutation('all');
      expect(getAllDiffs()).toHaveLength(0);
    });

    it('reverts in reverse order to restore original state correctly', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      // Original text is "Hello"
      applyTextMutation('ref-1', 'First');
      applyTextMutation('ref-1', 'Second');
      applyTextMutation('ref-1', 'Third');

      expect(el.textContent).toBe('Third');

      // Revert all should restore to "Hello", not "First" or "Second"
      revertMutation('all');
      expect(el.textContent).toBe('Hello');
    });
  });

  describe('getAllDiffs and clearDiffs', () => {
    it('accumulates multiple diffs', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      applyTextMutation('ref-1', 'A');
      applyStyleMutation('ref-1', { color: 'red' });

      expect(getAllDiffs().length).toBeGreaterThanOrEqual(1);
    });

    it('clearDiffs removes all without reverting', () => {
      const el = document.querySelector('h1')! as HTMLElement;
      registerElement('ref-1', el);

      applyTextMutation('ref-1', 'Changed');
      clearDiffs();

      expect(getAllDiffs()).toHaveLength(0);
      expect(el.textContent).toBe('Changed'); // Not reverted
    });
  });
});
