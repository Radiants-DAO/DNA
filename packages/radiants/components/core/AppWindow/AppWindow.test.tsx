import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppWindow, AppWindowBody, AppWindowPane, AppWindowSplitView } from './AppWindow';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('AppWindow', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders desktop presentation with title and window body', () => {
    render(
      <AppWindow id="about" title="About">
        <AppWindowBody>Body content</AppWindowBody>
      </AppWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders windowed presentation with PixelBorder edges and drop-shadow', () => {
    render(
      <AppWindow id="about" title="About">
        <AppWindowBody>Body content</AppWindowBody>
      </AppWindow>,
    );

    const dialog = screen.getByRole('dialog', { name: 'About' });
    expect(dialog.className).not.toContain('pixel-rounded');
    expect(dialog.style.filter).toBe('drop-shadow(4px 4px 0 var(--color-ink))');
    expect(dialog.querySelectorAll('svg[viewBox="0 0 9 9"]')).toHaveLength(4);
  });

  test('renders split compare panes with shared window layout helper', () => {
    render(
      <AppWindow id="lab" title="Control Surface Lab">
        <AppWindowSplitView>
          <AppWindowPane padding="sm">Legacy pane</AppWindowPane>
          <AppWindowPane padding="sm">RDNA pane</AppWindowPane>
        </AppWindowSplitView>
      </AppWindow>,
    );

    expect(screen.getByText('Legacy pane')).toBeInTheDocument();
    expect(screen.getByText('RDNA pane')).toBeInTheDocument();
    expect(document.querySelector('[data-window-layout="split"]')).toBeInTheDocument();
  });

  test('renders mobile presentation with close action', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AppWindow id="about" title="About" presentation="mobile" onClose={onClose}>
        <div>Mobile content</div>
      </AppWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'About' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close About' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders action button links as real anchors', () => {
    render(
      <AppWindow
        id="about"
        title="About"
        showActionButton
        actionButton={{ text: 'Docs', href: 'https://example.com/docs', target: '_blank' }}
      >
        <div>Body</div>
      </AppWindow>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('auto-centers windowed presentation when requested', async () => {
    const onPositionChange = vi.fn();

    render(
      <AppWindow id="about" title="About" autoCenter onPositionChange={onPositionChange}>
        <AppWindowBody>Body content</AppWindowBody>
      </AppWindow>,
    );

    await waitFor(() => {
      expect(onPositionChange).toHaveBeenCalledWith({ x: 350, y: 276 });
    });
  });

  test('calls onSizeChange when resized from an edge handle', () => {
    const onSizeChange = vi.fn();
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      width: 400,
      height: 300,
      toJSON: () => ({}),
    }) as DOMRect);

    render(
      <AppWindow
        id="about"
        title="About"
        size={{ width: 400, height: 300 }}
        onSizeChange={onSizeChange}
      >
        <div>Body</div>
      </AppWindow>,
    );

    fireEvent.pointerDown(document.querySelector('[data-resize-handle="e"]')!, {
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 100 });
    fireEvent.pointerUp(document);

    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 450, height: 300 });
    rectSpy.mockRestore();
  });

  test('does not render when widget mode is active', () => {
    render(
      <AppWindow id="about" title="About" widgetActive>
        <div>Hidden by widget mode</div>
      </AppWindow>,
    );

    expect(screen.queryByRole('dialog', { name: 'About' })).not.toBeInTheDocument();
  });

  test('does not render when open is false', () => {
    render(
      <AppWindow id="about" title="About" open={false}>
        <div>Hidden</div>
      </AppWindow>,
    );

    expect(screen.queryByRole('dialog', { name: 'About' })).not.toBeInTheDocument();
  });

  describe('compound children', () => {
    test('renders Nav items in the titlebar zone', () => {
      render(
        <AppWindow id="test" title="Test">
          <AppWindow.Nav value="tab1" onChange={() => {}}>
            <AppWindow.Nav.Item value="tab1">Tab 1</AppWindow.Nav.Item>
            <AppWindow.Nav.Item value="tab2">Tab 2</AppWindow.Nav.Item>
          </AppWindow.Nav>
          <AppWindow.Content>
            <div>Content here</div>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByRole('dialog', { name: 'Test' })).toBeInTheDocument();
      expect(screen.getByText('Content here')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    });

    test('renders Toolbar between titlebar and content', () => {
      render(
        <AppWindow id="test" title="Test">
          <AppWindow.Toolbar>
            <input placeholder="Search..." />
          </AppWindow.Toolbar>
          <AppWindow.Content>
            <div>Below toolbar</div>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Below toolbar')).toBeInTheDocument();
      expect(document.querySelector('[data-window-toolbar]')).toBeInTheDocument();
    });

    test('bare children still render in content area (backward compat)', () => {
      render(
        <AppWindow id="test" title="Test">
          <AppWindowBody>Legacy content</AppWindowBody>
        </AppWindow>,
      );

      expect(screen.getByText('Legacy content')).toBeInTheDocument();
    });

    test('Toolbar works without Nav', () => {
      render(
        <AppWindow id="test" title="Test">
          <AppWindow.Toolbar>
            <input placeholder="Filter..." />
          </AppWindow.Toolbar>
          <AppWindow.Content>
            <div>Filtered results</div>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
      expect(screen.getByText('Filtered results')).toBeInTheDocument();
    });
  });

  describe('Island', () => {
    test('renders with standard corners (rounded + border) and bg-card by default', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island>Island content</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Island content')).toBeInTheDocument();
      const island = screen.getByText('Island content').closest('[class*="rounded"]');
      expect(island).toBeInTheDocument();
      expect(island?.className).toContain('bg-card');
      expect(island?.className).toContain('border');
      expect(island?.className).not.toContain('pixel-rounded');
    });

    test('renders with PixelBorder wrapper when corners="pixel"', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island corners="pixel" noScroll className="test-pixel-island">
              Pixel content
            </AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      const island = container.querySelector('.test-pixel-island');
      expect(island).toBeInTheDocument();
      expect(island?.className).not.toContain('border');
      expect(island?.querySelectorAll('svg[viewBox="0 0 5 5"]')).toHaveLength(4);
    });

    test('applies padding variants', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island padding="sm">Padded</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Padded')).toBeInTheDocument();
      expect(container.querySelector('.p-2')).toBeInTheDocument();
    });

    test('renders with fixed width when width prop is set', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="sidebar">
            <AppWindow.Island width="w-48">Sidebar</AppWindow.Island>
            <AppWindow.Island>Main</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      const sidebar = screen.getByText('Sidebar').closest('[class*="rounded"]');
      expect(sidebar?.className).toContain('shrink-0');
      expect(sidebar?.className).toContain('w-48');
    });

    test('renders with custom bgClassName', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island bgClassName="bg-page">Custom bg</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      const island = screen.getByText('Custom bg').closest('[class*="rounded"]');
      expect(island?.className).toContain('bg-page');
      expect(island?.className).not.toContain('bg-card');
    });
  });

  describe('Banner', () => {
    test('renders edge-to-edge content above islands', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Banner>Hero image</AppWindow.Banner>
            <AppWindow.Island>Below banner</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Hero image')).toBeInTheDocument();
      expect(screen.getByText('Below banner')).toBeInTheDocument();
      const banner = screen.getByText('Hero image').closest('[class*="shrink-0"]');
      expect(banner).toBeInTheDocument();
      expect(banner?.className).not.toContain('pixel-rounded');
      expect(banner?.className).not.toContain('bg-card');
    });
  });

  describe('Content layouts', () => {
    test('single layout adds gutters around island', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="single">
            <AppWindow.Island>Single content</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Single content')).toBeInTheDocument();
      expect(container.querySelector('.px-1\\.5')).toBeInTheDocument();
      expect(container.querySelector('.pb-1\\.5')).toBeInTheDocument();
    });

    test('split layout renders two islands side by side', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="split">
            <AppWindow.Island>Left</AppWindow.Island>
            <AppWindow.Island>Right</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
      expect(container.querySelector('.gap-1\\.5')).toBeInTheDocument();
    });

    test('sidebar layout renders fixed-width + flexible islands', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="sidebar">
            <AppWindow.Island width="w-48">Nav</AppWindow.Island>
            <AppWindow.Island>Main</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      const nav = screen.getByText('Nav').closest('[class*="rounded"]');
      const main = screen.getByText('Main').closest('[class*="rounded"]');
      expect(nav?.className).toContain('shrink-0');
      expect(nav?.className).toContain('w-48');
      expect(main?.className).toContain('flex-1');
    });

    test('bleed layout renders without gutters', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="bleed">
            <div data-testid="bleed-content">Full bleed</div>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByTestId('bleed-content')).toBeInTheDocument();
      const contentDiv = screen.getByTestId('bleed-content').parentElement;
      expect(contentDiv?.className).not.toContain('px-1.5');
      expect(contentDiv?.className).not.toContain('pb-1.5');
    });

    test('banner renders above islands in split layout', () => {
      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="split">
            <AppWindow.Banner>Header</AppWindow.Banner>
            <AppWindow.Island>Left</AppWindow.Island>
            <AppWindow.Island>Right</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      const header = screen.getByText('Header');
      const left = screen.getByText('Left');
      expect(header.compareDocumentPosition(left) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('default layout is single', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island>Default</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(container.querySelector('.px-1\\.5')).toBeInTheDocument();
    });
  });
});
