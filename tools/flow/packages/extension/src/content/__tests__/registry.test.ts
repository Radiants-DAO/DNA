import { describe, it, expect } from 'vitest';
import { createRegistry } from '../features/registry';

describe('feature registry', () => {
  it('activates a feature and calls deactivate on switch', () => {
    const registry = createRegistry();
    let deactivated = false;
    registry.register('a', { activate: () => () => (deactivated = true) });
    registry.register('b', { activate: () => () => {} });
    registry.activate('a');
    registry.activate('b');
    expect(deactivated).toBe(true);
  });

  it('does not crash when activating unregistered feature', () => {
    const registry = createRegistry();
    expect(() => registry.activate('nonexistent')).not.toThrow();
  });

  it('returns list of registered feature ids', () => {
    const registry = createRegistry();
    registry.register('x', { activate: () => () => {} });
    registry.register('y', { activate: () => () => {} });
    expect(registry.getRegistered()).toEqual(['x', 'y']);
  });

  it('allows deactivating without switching', () => {
    const registry = createRegistry();
    let deactivated = false;
    registry.register('a', { activate: () => () => (deactivated = true) });
    registry.activate('a');
    registry.deactivate();
    expect(deactivated).toBe(true);
  });
});
