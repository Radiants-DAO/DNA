import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const setActiveTab = vi.fn();
let activeTab: string | undefined;

vi.mock('@rdna/radiants/components/core', () => {
  const Nav = Object.assign(
    ({
      children,
      value,
      onChange,
      showInactiveLabels,
    }: {
      children: React.ReactNode;
      value?: string;
      onChange?: (value: string) => void;
      showInactiveLabels?: boolean;
    }) => (
      <div
        data-testid="app-window-nav"
        data-value={value}
        data-show-inactive-labels={String(Boolean(showInactiveLabels))}
      >
        {React.Children.map(children, (child) => {
          if (
            !React.isValidElement<{
              children: React.ReactNode;
              icon?: React.ReactNode;
              value?: string;
            }>(child)
          ) {
            return child;
          }
          const itemValue = child.props.value;
          return (
            <button
              type="button"
              data-value={itemValue}
              onClick={() => itemValue && onChange?.(itemValue)}
            >
              <span data-testid={`pixel-lab-tab-icon-${itemValue}`}>
                {child.props.icon}
              </span>
              {child.props.children}
            </button>
          );
        })}
      </div>
    ),
    {
      Item: () => null,
    },
  );

  const AppWindow = Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Nav,
      Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Island: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    },
  );

  return { AppWindow };
});

vi.mock('@rdna/radiants/icons/runtime', () => ({
  Icon: ({ name }: { name?: string }) => <span>{name}</span>,
}));

vi.mock('@/hooks/useWindowManager', () => ({
  useWindowManager: () => ({
    getActiveTab: () => activeTab,
    setActiveTab,
  }),
}));

vi.mock('@/components/apps/studio/PixelArtEditor', () => ({
  default: () => <div>Studio editor mounted</div>,
}));

vi.mock('@/components/apps/pixel-playground', () => ({
  PixelPlayground: ({ initialMode, lockedMode }: { initialMode?: string; lockedMode?: boolean }) => (
    <div>
      Pixel playground mounted
      <span data-testid="pixel-playground-mode">{initialMode}</span>
      <span data-testid="pixel-playground-locked">{lockedMode ? 'locked' : 'unlocked'}</span>
    </div>
  ),
}));

import { PixelLab } from '@/components/apps/pixel-lab/PixelLab';

describe('PixelLab', () => {
  afterEach(() => {
    cleanup();
    setActiveTab.mockClear();
    activeTab = undefined;
  });

  it('defaults to the Radiants surface while keeping the other workbenches available', () => {
    activeTab = undefined;

    render(<PixelLab windowId="pixel-lab" />);

    expect(screen.getByTestId('app-window-nav')).toHaveAttribute('data-value', 'radiants');
    expect(screen.getByText('Studio editor mounted')).toBeInTheDocument();
    expect(screen.queryByText('Pixel playground mounted')).not.toBeInTheDocument();
  });

  it('uses icon-only chrome tabs with 16px-backed icon names', () => {
    activeTab = 'radiants';

    render(<PixelLab windowId="pixel-lab" />);

    expect(screen.getByTestId('app-window-nav')).toHaveAttribute(
      'data-show-inactive-labels',
      'false',
    );
    expect(screen.getByTestId('pixel-lab-tab-icon-radiants')).toHaveTextContent('rad-mark');
    expect(screen.getByTestId('pixel-lab-tab-icon-corners')).toHaveTextContent('resize-corner');
    expect(screen.getByTestId('pixel-lab-tab-icon-icons')).toHaveTextContent('document-image');
    expect(screen.getByTestId('pixel-lab-tab-icon-patterns')).toHaveTextContent('css-grid');
    expect(screen.getByTestId('pixel-lab-tab-icon-dither')).toHaveTextContent('equalizer');
    expect(screen.getByTestId('pixel-lab-tab-icon-canvas')).toHaveTextContent('pencil');
  });

  it('switches shell modes through the app nav without owning migrated internals yet', () => {
    activeTab = 'radiants';

    render(<PixelLab windowId="pixel-lab" />);
    fireEvent.click(screen.getByRole('button', { name: /icons/i }));

    expect(setActiveTab).toHaveBeenCalledWith('pixel-lab', 'icons');
  });

  it.each([
    ['corners'],
    ['icons'],
    ['patterns'],
  ])('renders the existing Pixel playground locked to %s mode', (mode) => {
    activeTab = mode;

    render(<PixelLab windowId="pixel-lab" />);

    expect(screen.getByTestId('app-window-nav')).toHaveAttribute('data-value', mode);
    expect(screen.getByText('Pixel playground mounted')).toBeInTheDocument();
    expect(screen.getByTestId('pixel-playground-mode')).toHaveTextContent(mode);
    expect(screen.getByTestId('pixel-playground-locked')).toHaveTextContent('locked');
    expect(screen.queryByText('Studio editor mounted')).not.toBeInTheDocument();
  });

  it('renders Dither as a preview workbench instead of an editable pixel playground', () => {
    activeTab = 'dither';

    render(<PixelLab windowId="pixel-lab" />);

    expect(screen.getByTestId('app-window-nav')).toHaveAttribute('data-value', 'dither');
    expect(screen.getByText('Dither ramp preview')).toBeInTheDocument();
    expect(screen.queryByText('Pixel playground mounted')).not.toBeInTheDocument();
    expect(screen.queryByText('Studio editor mounted')).not.toBeInTheDocument();
  });

  it('reserves the Canvas workbench without pretending the full editor exists yet', () => {
    activeTab = 'canvas';

    render(<PixelLab windowId="pixel-lab" />);

    expect(screen.getByTestId('app-window-nav')).toHaveAttribute('data-value', 'canvas');
    expect(screen.getByText(/Canvas workbench/i)).toBeInTheDocument();
    expect(screen.queryByText('Pixel playground mounted')).not.toBeInTheDocument();
    expect(screen.queryByText('Studio editor mounted')).not.toBeInTheDocument();
  });
});
