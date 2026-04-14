import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@rdna/radiants/components/core', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  Input: ({ value = '', onChange, placeholder }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@rdna/radiants/registry', () => ({
  registry: Array.from({ length: 7 }, (_, index) => ({
    name: `Alpha ${index + 1}`,
    description: 'Heavy demo card',
    category: 'feedback',
    component: ({ label }: { label?: string }) => (
      <div data-testid={`demo-preview-${index + 1}`}>{label ?? `preview-${index + 1}`}</div>
    ),
    defaultProps: {
      label: `Loaded preview ${index + 1}`,
    },
    props: {
      label: {
        type: 'string',
      },
    },
    states: [],
    renderMode: 'component',
  })),
  CATEGORIES: ['feedback'],
  CATEGORY_LABELS: { feedback: 'Feedback' },
  getPreviewStateNames: () => [],
  resolvePreviewState: () => ({ wrapperState: undefined, propOverrides: {} }),
  PropControls: () => <div data-testid="prop-controls">Prop controls</div>,
  useShowcaseProps: (entry: { defaultProps?: Record<string, unknown> }) => ({
    props: entry.defaultProps ?? {},
    remountKey: 'alpha',
    setPropValue: vi.fn(),
    resetProps: vi.fn(),
  }),
}));

import { DesignSystemTab } from '@/components/ui/DesignSystemTab';

describe('DesignSystemTab', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('defers heavy showcase content until a card enters view', async () => {
    render(
      <DesignSystemTab
        hideControls
        initialInteractiveCards={0}
        searchQuery="Alpha 1"
      />,
    );

    expect(screen.getByText('Alpha 1')).toBeInTheDocument();
    expect(screen.getByText('Heavy demo card')).toBeInTheDocument();
    expect(screen.queryByTestId('demo-preview-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prop-controls')).not.toBeInTheDocument();

    MockIntersectionObserver.triggerAll();

    await waitFor(() => {
      expect(screen.getByTestId('demo-preview-1')).toHaveTextContent('Loaded preview 1');
    });
    expect(screen.getByTestId('prop-controls')).toBeInTheDocument();
  });

  it('mounts only the initial interactive budget on first render', () => {
    const { container } = render(<DesignSystemTab hideControls />);

    expect(container.querySelectorAll('[data-testid^="demo-preview-"]')).toHaveLength(6);
    expect(screen.getAllByText('Preview mounts on scroll')).toHaveLength(1);
    expect(screen.getAllByText('Controls mount on scroll')).toHaveLength(1);
  });
});
