import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUnifiedMutationEngine } from '../unifiedMutationEngine';

// This module depends heavily on DOM events and contentEditable.
// Minimal smoke tests here; full behavior tested in integration.

describe('textEditMode', () => {
  beforeEach(() => {
    document.body.innerHTML = '<p id="text">Hello World</p>';
  });

  it('exports activate, deactivate, and init functions', async () => {
    // Dynamic import to verify module shape
    const mod = await import('../textEditMode');
    expect(typeof mod.activateTextEditMode).toBe('function');
    expect(typeof mod.deactivateTextEditMode).toBe('function');
    expect(typeof mod.initTextEditMode).toBe('function');
  });

  it('activateTextEditMode registers click handler', async () => {
    const mod = await import('../textEditMode');
    const onDiff = vi.fn();

    // Should not throw
    mod.activateTextEditMode({ onDiff });

    // Clean up
    mod.deactivateTextEditMode();
  });

  it('deactivateTextEditMode can be called without error when not active', async () => {
    const mod = await import('../textEditMode');

    // Should not throw even if not activated
    expect(() => mod.deactivateTextEditMode()).not.toThrow();
  });

  it('initTextEditMode registers handlers without throwing', async () => {
    const mod = await import('../textEditMode');

    // Should not throw - just registers handlers
    expect(() => mod.initTextEditMode()).not.toThrow();
  });

  it('requires a second click to enter contentEditable mode', async () => {
    const mod = await import('../textEditMode');
    const onDiff = vi.fn();
    const target = document.getElementById('text') as HTMLElement;

    mod.activateTextEditMode({ onDiff });
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(target.style.outline).toBe('');

    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(target.style.outline).toContain('2px solid');

    mod.deactivateTextEditMode();
  });

  it('records committed text changes through unified mutation engine', async () => {
    const mod = await import('../textEditMode');
    const engine = createUnifiedMutationEngine();
    const onDiff = vi.fn();
    const target = document.getElementById('text') as HTMLElement;

    mod.initTextEditMode(engine);
    mod.activateTextEditMode({ onDiff });

    // First click arms, second click enters edit mode.
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(target.style.outline).toContain('2px solid');

    target.textContent = 'Updated copy';
    target.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));

    expect(onDiff).toHaveBeenCalledTimes(1);
    const diffs = engine.getDiffs();
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('text');
    expect(diffs[0].changes[0]).toMatchObject({
      property: 'textContent',
      oldValue: 'Hello World',
      newValue: 'Updated copy',
    });

    mod.deactivateTextEditMode();
  });
});
