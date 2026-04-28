import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  private readonly elements = new Set<Element>();

  constructor(_callback: IntersectionObserverCallback) {
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

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

vi.mock('@rdna/radiants/components/core', () => {
  const Nav = Object.assign(
    ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value?: string;
    }) => <div data-testid="app-window-nav" data-value={value}>{children}</div>,
    {
      Item: ({
        children,
        value,
      }: {
        children: React.ReactNode;
        value: string;
      }) => <button type="button" data-value={value}>{children}</button>,
    },
  );

  const AppWindow = Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Nav,
      Content: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => <div className={className}>{children}</div>,
      Island: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => <div className={className}>{children}</div>,
    },
  );

  return {
    AppWindow,
    Button: ({
      children,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    CompactRowButton: ({
      children,
      selected,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) => (
      <button
        type="button"
        data-selected={selected ? 'true' : 'false'}
        onClick={onClick}
        {...props}
      >
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
  };
});

vi.mock('@rdna/radiants/icons/runtime', () => ({
  Icon: ({ name }: { name?: string }) => <span>{name ?? 'icon'}</span>,
  RadMarkIcon: () => <span>radmark</span>,
  FontAaIcon: () => <span>font-aa</span>,
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
      props: { label: { type: 'string' } },
      states: [],
      renderMode: 'inline',
      tokenBindings: null,
    },
  ],
  CATEGORIES: ['action'],
  CATEGORY_LABELS: {
    action: 'Actions',
  },
  getPreviewStateNames: () => [],
  resolvePreviewState: () => ({
    wrapperState: undefined,
    propOverrides: {},
  }),
  PropControls: () => <div data-testid="prop-controls">Prop controls</div>,
  useShowcaseProps: (entry: { defaultProps?: Record<string, unknown> }) => ({
    props: entry.defaultProps ?? {},
    remountKey: 'test',
    setPropValue: vi.fn(),
    resetProps: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWindowManager', () => ({
  useWindowManager: () => ({
    getActiveTab: () => 'components',
    setActiveTab: vi.fn(),
  }),
}));

import { LabApp } from '@/components/apps/LabApp';

describe('Dev Tools UI Library tab', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('keeps the current split browser layout instead of the legacy tab shell', () => {
    render(<LabApp windowId="lab" />);

    expect(screen.getByRole('button', { name: /ui library/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pixel/i })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('A clickable button')).toBeInTheDocument();
    expect(screen.getByText('Prop controls')).toBeInTheDocument();
    expect(screen.queryByText('Select a component to inspect')).not.toBeInTheDocument();
    expect(screen.queryByText('Code output appears here')).not.toBeInTheDocument();
  });

  it('shows the code panel after interacting with the live component preview', () => {
    render(<LabApp windowId="lab" />);

    expect(screen.queryByText('Code')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId('demo-button')[0]);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
