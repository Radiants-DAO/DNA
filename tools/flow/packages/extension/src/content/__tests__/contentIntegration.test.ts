import { describe, it, expect } from 'vitest';
import { createSelectionEngine } from '../selection/selectionEngine';
import { createRegistry } from '../features/registry';
import { createGuidesState } from '../guides/guides';

describe('content integration', () => {
  it('exposes selection state getter', () => {
    const engine = createSelectionEngine();
    expect(engine.getState().ids).toEqual([]);
  });

  it('creates an empty feature registry', () => {
    const registry = createRegistry();
    expect(registry.getRegistered()).toEqual([]);
  });

  it('creates default guides state', () => {
    const guides = createGuidesState();
    expect(guides.visible).toBe(false);
    expect(guides.horizontalY).toBeNull();
    expect(guides.verticalX).toBeNull();
  });
});
