import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mock IntersectionObserver
// ============================================================================

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  private readonly callback: IntersectionObserverCallback;
  private readonly elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = (element: Element) => {
    this.elements.add(element);
  };

  unobserve = (element: Element) => {
    this.elements.delete(element);
  };

  disconnect = () => {
    this.elements.clear();
  };

  takeRecords = () => [];

  static triggerAll(isIntersecting = true) {
    for (const instance of MockIntersectionObserver.instances) {
      const entries = [...instance.elements].map(
        (target) =>
          ({
            isIntersecting,
            target,
          }) as IntersectionObserverEntry,
      );
      instance.callback(entries, instance as unknown as IntersectionObserver);
    }
  }

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@rdna/radiants/components/core', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Input: ({
    value = '',
    onChange,
    placeholder,
  }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
  ToggleGroup: Object.assign(
    ({ children }: { children: React.ReactNode }) => (
      <div data-testid="toggle-group">{children}</div>
    ),
    {
      Item: ({ children }: { children: React.ReactNode }) => (
        <button type="button">{children}</button>
      ),
    },
  ),
}));

vi.mock('@rdna/radiants/registry', () => ({
  registry: [
    {
      name: 'Button',
      description: 'A clickable button',
      category: 'action',
      component: ({ label }: { label?: string }) => (
        <div data-testid="demo-button">{label ?? 'Click me'}</div>
      ),
      defaultProps: { label: 'Click me' },
      props: { label: { type: 'string' }, variant: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
    {
      name: 'Input',
      description: 'A text input',
      category: 'form',
      component: () => <div data-testid="demo-input">Input</div>,
      defaultProps: {},
      props: { placeholder: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
    {
      name: 'Badge',
      description: 'A badge label',
      category: 'data-display',
      component: ({ label }: { label?: string }) => (
        <div data-testid="demo-badge">{label ?? 'badge'}</div>
      ),
      defaultProps: { label: 'badge' },
      props: { label: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
  ],
  CATEGORIES: ['action', 'form', 'data-display'],
  CATEGORY_LABELS: {
    action: 'Actions',
    form: 'Forms',
    'data-display': 'Data Display',
  },
  getPreviewStateNames: () => [],
  resolvePreviewState: () => ({
    wrapperState: undefined,
    propOverrides: {},
  }),
  PropControls: () => <div data-testid="prop-controls">Prop controls</div>,
  useShowcaseProps: (entry: { defaultProps?: Record<string, unknown> }) => ({
    props: entry.defaultProps ?? {},
    overrides: {},
    remountKey: 'test',
    setPropValue: vi.fn(),
    resetProps: vi.fn(),
  }),
}));

import { UILibraryTab } from '@/components/ui/UILibraryTab';

// ============================================================================
// Tests
// ============================================================================

describe('UILibraryTab', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('renders three-column layout with navigator, gallery, and code output', () => {
    render(<UILibraryTab />);

    // Col 1: search + category buttons
    expect(screen.getAllByPlaceholderText('Search...').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('All (3)')).toBeInTheDocument();

    // Gallery shows category headers
    expect(screen.getAllByText('Actions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Forms').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Data Display').length).toBeGreaterThanOrEqual(1);

    // Col 3: empty state
    expect(
      screen.getAllByText('Select a component to see its code output').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders eager cards immediately and defers the rest', async () => {
    render(<UILibraryTab initialInteractiveCards={1} />);

    // First card (Button) is eager — should have at least one demo
    expect(screen.getAllByTestId('demo-button').length).toBeGreaterThanOrEqual(1);

    // Trigger intersection for any deferred cards
    MockIntersectionObserver.triggerAll();

    await waitFor(() => {
      // All three component previews should now be visible
      expect(screen.getAllByTestId('demo-button').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('demo-input').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('demo-badge').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('selecting a gallery card populates code output', () => {
    const { container } = render(<UILibraryTab />);

    // Click the first gallery card (Button) — it's inside the flex-1 gallery column
    const gallery = container.querySelector('.flex-1.min-w-0');
    const galleryCard = gallery?.querySelector('button');
    expect(galleryCard).toBeTruthy();
    fireEvent.click(galleryCard!);

    // Code output should now show generated JSX for the selected component
    expect(screen.getByText('Code')).toBeInTheDocument();
    const codeBlock = container.querySelector('pre');
    expect(codeBlock?.textContent).toContain('<Button');
  });

  it('hides navigator when hideControls is true', () => {
    const { container } = render(<UILibraryTab hideControls />);

    // Navigator column (w-56) should not be rendered
    expect(container.querySelector('.w-56')).toBeNull();
    // Gallery (flex-1) still renders
    expect(container.querySelector('.flex-1')).not.toBeNull();
  });
});
