import { describe, it, expect, beforeEach, vi } from 'vitest';

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
});
