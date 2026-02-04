import { describe, it, expect, beforeEach } from 'vitest';
import { extractFiberData } from '../fiberWalker';

describe('fiberWalker', () => {
  beforeEach(() => {
    // Reset window globals
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  });

  it('returns null when no React hook is present', () => {
    const el = document.createElement('div');
    expect(extractFiberData(el)).toBeNull();
  });

  it('returns null when element has no fiber key', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };
    const el = document.createElement('div');
    expect(extractFiberData(el)).toBeNull();
  });

  it('extracts component name from fiber with displayName', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };

    const el = document.createElement('div');
    const mockFiber = {
      tag: 0, // FUNCTION_COMPONENT
      type: { displayName: 'MyButton', name: 'MyButton' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: { variant: 'primary', disabled: false },
      _debugSource: {
        fileName: '/src/components/Button.tsx',
        lineNumber: 42,
        columnNumber: 5,
      },
    };
    (el as any).__reactFiber$abc123 = mockFiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('MyButton');
    expect(result!.props).toEqual({ variant: 'primary', disabled: false });
    expect(result!.source).toEqual({
      fileName: '/src/components/Button.tsx',
      lineNumber: 42,
      columnNumber: 5,
    });
  });

  it('walks parent chain to build hierarchy', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };

    const el = document.createElement('div');
    const grandparent = {
      tag: 0,
      type: { name: 'App' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: {},
      _debugSource: { fileName: '/src/App.tsx', lineNumber: 10 },
    };
    const parent = {
      tag: 0,
      type: { name: 'HeroSection' },
      stateNode: null,
      return: grandparent,
      child: null,
      sibling: null,
      memoizedProps: {},
      _debugSource: { fileName: '/src/Hero.tsx', lineNumber: 5 },
    };
    const fiber = {
      tag: 0,
      type: { name: 'Button' },
      stateNode: null,
      return: parent,
      child: null,
      sibling: null,
      memoizedProps: { label: 'Click' },
      _debugSource: { fileName: '/src/Button.tsx', lineNumber: 20 },
    };
    (el as any).__reactFiber$abc123 = fiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('Button');
    expect(result!.hierarchy).toHaveLength(2);
    expect(result!.hierarchy[0].componentName).toBe('HeroSection');
    expect(result!.hierarchy[1].componentName).toBe('App');
  });

  it('handles host fiber by walking up to nearest component', () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };

    const el = document.createElement('div');
    const componentFiber = {
      tag: 0,
      type: { name: 'Card' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: { title: 'Hello' },
      _debugSource: { fileName: '/src/Card.tsx', lineNumber: 8 },
    };
    const hostFiber = {
      tag: 5, // HostComponent (div, span, etc.)
      type: 'div',
      stateNode: el,
      return: componentFiber,
      child: null,
      sibling: null,
      memoizedProps: { className: 'card' },
    };
    (el as any).__reactFiber$abc123 = hostFiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('Card');
  });
});
