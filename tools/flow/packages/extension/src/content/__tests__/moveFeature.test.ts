import { describe, it, expect } from 'vitest';
import { moveElement } from '../features/move';

describe('move feature', () => {
  it('moves element right by inserting after sibling', () => {
    const parent = document.createElement('div');
    const a = document.createElement('div');
    const b = document.createElement('div');
    parent.append(a, b);

    moveElement(a, 'right');
    expect(parent.lastElementChild).toBe(a);
  });

  it('moves element left by inserting before sibling', () => {
    const parent = document.createElement('div');
    const a = document.createElement('div');
    const b = document.createElement('div');
    parent.append(a, b);

    moveElement(b, 'left');
    expect(parent.firstElementChild).toBe(b);
  });

  it('does nothing when no sibling in direction', () => {
    const parent = document.createElement('div');
    const a = document.createElement('div');
    parent.append(a);

    moveElement(a, 'left');
    expect(parent.firstElementChild).toBe(a);
  });

  it('handles element without parent', () => {
    const el = document.createElement('div');
    expect(() => moveElement(el, 'right')).not.toThrow();
  });
});
