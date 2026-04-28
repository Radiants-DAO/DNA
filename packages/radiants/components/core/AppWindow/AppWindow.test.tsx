import { readFileSync } from 'node:fs';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppWindow } from './AppWindow';

let lastDraggableProps: Record<string, unknown> | null = null;

vi.mock('react-draggable', () => ({
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    lastDraggableProps = props;
    return <>{children}</>;
  },
}));

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
    lastDraggableProps = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders desktop presentation with title and window body', () => {
    render(
      <AppWindow id="about" title="About">
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders windowed presentation with the expected shadow and resize handles', () => {
    render(
      <AppWindow id="about" title="About">
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const dialog = screen.getByRole('dialog', { name: 'About' });
    const wrapper = dialog.parentElement;
    expect(wrapper).toHaveAttribute('data-aw-shell', 'wrapper');
    expect(wrapper?.querySelector('.pat-pixel-shadow')).toBeInTheDocument();
    expect(wrapper?.querySelector('.pat-pixel-shadow > .pat-pixel-shadow__fill')).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-resizable', 'true');
    expect(dialog.querySelectorAll('[data-resize-handle]')).toHaveLength(8);
  });

  test('caps window shell height inside the desktop viewport margin', () => {
    render(
      <AppWindow id="about" title="About" size={{ width: 600, height: 900 }}>
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const wrapper = screen.getByRole('dialog', { name: 'About' }).parentElement as HTMLElement;
    expect(wrapper).toHaveAttribute('data-aw-shell', 'wrapper');
    expect(wrapper.style.maxHeight).toBe('736px');
  });

  test('configures draggable cancel selectors for titlebar controls and tabs', () => {
    render(
      <AppWindow id="about" title="About" onClose={() => {}}>
        <AppWindow.Nav value="one" onChange={() => {}}>
          <AppWindow.Nav.Item value="one">One</AppWindow.Nav.Item>
        </AppWindow.Nav>
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(lastDraggableProps).toEqual(
      expect.objectContaining({
        cancel: expect.stringContaining('[data-aw-controls-no-drag]'),
      }),
    );
    expect(lastDraggableProps).toEqual(
      expect.objectContaining({
        cancel: expect.stringContaining('[data-aw="titlebar-nav"]'),
      }),
    );
  });

  test('renders a dither-chrome band stack inside standard window chrome', () => {
    const { container } = render(
      <AppWindow id="about" title="About">
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const overlay = container.querySelector<HTMLElement>('[data-appwindow-chrome-dither]');
    expect(overlay).not.toBeNull();

    const bands = overlay!.querySelectorAll<HTMLElement>(
      '[data-appwindow-chrome-dither-band]',
    );
    expect(bands.length).toBeGreaterThan(1);

    const first = bands[0]!;
    expect(first.style.backgroundColor).toBe('var(--color-window-chrome-from)');
    expect(first.style.maskRepeat || first.style.webkitMaskRepeat).toBe('repeat');
    expect(first.style.maskImage || first.style.webkitMaskImage).toMatch(/^url\("data:image\/svg/);
  });

  test('renders an unfocused overlay using rdna-pat diagonal-dots pattern', () => {
    const { container } = render(
      <AppWindow id="about" title="About" focused={false}>
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const overlay = container.querySelector('.rdna-pat.rdna-pat--diagonal-dots');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.getAttribute('style')).toContain('--pat-color');
    expect(overlay).toHaveClass('pointer-events-none');
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

  test('uses the shared structural shell for mobile presentation', () => {
    const { container } = render(
      <AppWindow id="about" title="About" presentation="mobile" onClose={() => {}}>
        <AppWindow.Content>
          <AppWindow.Island>Mobile content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(container.querySelector('[data-aw="window"]')).toBeInTheDocument();
    expect(container.querySelector('[data-aw="titlebar"]')).toBeInTheDocument();
    expect(container.querySelector('[data-aw="stage"]')).toBeInTheDocument();
    expect(container.querySelector('header')).not.toBeInTheDocument();
  });

  test('fires fullscreen focus once per click interaction', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();

    render(
      <AppWindow id="about" title="About" presentation="fullscreen" onFocus={onFocus}>
        <div>Fullscreen content</div>
      </AppWindow>,
    );

    await user.click(screen.getByRole('dialog', { name: 'About' }));

    // onPointerDown and onClick both call handleFocus — 2 calls is by design
    expect(onFocus).toHaveBeenCalledTimes(2);
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
        <AppWindow.Content>
          <AppWindow.Island>Body content</AppWindow.Island>
        </AppWindow.Content>
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
    test('renders structural data-aw nodes with absolute-fill scroll ownership', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island padding="sm">Island content</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(container.querySelector('[data-aw="window"]')).toBeInTheDocument();
      expect(container.querySelector('[data-aw="titlebar"]')).toBeInTheDocument();
      expect(container.querySelector('[data-aw="stage"][data-layout="single"]')).toBeInTheDocument();
      // Single layouts render children directly under stage (no inner [data-aw="layout"] wrapper)
      expect(container.querySelector('[data-aw="layout"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-aw="island"]')).toBeInTheDocument();

      const scrollRoot = container.querySelector('[data-aw="island-scroll"]');
      expect(scrollRoot).toBeInTheDocument();
      const island = container.querySelector('[data-aw="island"]');
      const islandPad = container.querySelector('[data-aw="island-pad"]');
      expect(islandPad).toBeInTheDocument();
      expect(island).toHaveAttribute('data-scroll-owner', 'island');
      // min-h-0 is owned by CSS ([data-aw="island"]), not duplicated inline
      expect(island?.getAttribute('data-aw')).toBe('island');
    });

    test('keeps the default Island scroll owner vertically scrollable in CSS', () => {
      const css = readFileSync('components/core/AppWindow/appwindow.css', 'utf8');
      const block = css.match(/\[data-aw="island-scroll"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? '';

      expect(block).toContain('overflow-y-auto');
      expect(block).toContain('overflow-x-hidden');
      expect(block).not.toContain('overflow-hidden');
    });

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

    test('renders with pixel corners when corners="pixel"', () => {
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
      expect(island).toHaveAttribute('data-scroll-owner', 'content');
      expect(island).toHaveClass('pixel-rounded-6');
      expect(island).toHaveClass('bg-card');
      expect(island?.className).not.toContain('border');
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

  describe('Content layouts', () => {
    test('warns in development when AppWindow.Content is nested inside AppWindow.Content', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island noScroll>
              <AppWindow.Content>
                <div>Nested content</div>
              </AppWindow.Content>
            </AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('AppWindow.Content'));
      warn.mockRestore();
    });

    test('only applies stage gutters when contentPadding is enabled', () => {
      const css = readFileSync('components/core/AppWindow/appwindow.css', 'utf8');
      const baseBlock = css.match(/\[data-aw="stage"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? '';
      const paddedBlock = css.match(/\[data-aw="stage"\]\[data-content-padding="true"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? '';

      expect(baseBlock).toContain('p-0');
      expect(baseBlock).not.toContain('px-1.5');
      expect(baseBlock).not.toContain('pb-1.5');
      expect(paddedBlock).toContain('px-1.5');
      expect(paddedBlock).toContain('pb-2');
    });

    test('single layout adds gutters around island', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content layout="single">
            <AppWindow.Island>Single content</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Single content')).toBeInTheDocument();
      expect(container.querySelector('[data-aw="stage"][data-layout="single"]')).toBeInTheDocument();
      // Single layouts flatten — no inner [data-aw="layout"] wrapper
      expect(container.querySelector('[data-aw="layout"]')).not.toBeInTheDocument();
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
      expect(container.querySelector('[data-aw="layout"][data-layout="split"]')).toBeInTheDocument();
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

    test('default layout is single', () => {
      const { container } = render(
        <AppWindow id="test" title="Test" contentPadding={false}>
          <AppWindow.Content>
            <AppWindow.Island>Default</AppWindow.Island>
          </AppWindow.Content>
        </AppWindow>,
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(container.querySelector('[data-aw="stage"][data-layout="single"]')).toBeInTheDocument();
      // Single layouts flatten — no inner [data-aw="layout"] wrapper
      expect(container.querySelector('[data-aw="layout"]')).not.toBeInTheDocument();
    });
  });

  describe('Control surfaces', () => {
    test('renders a wrapper + rail per registered side, with tab + scrollable LCD', () => {
      const { container } = render(
        <AppWindow
          id="dock"
          title="Dock"
          controlSurfaces={[
            { id: 'dock:left', side: 'left', children: <div>Left dock body</div> },
            { id: 'dock:bottom', side: 'bottom', children: <div>Bottom dock body</div> },
          ]}
        >
          <div>Body</div>
        </AppWindow>,
      );

      expect(container.querySelector('[data-aw-shell="wrapper"]')).toBeInTheDocument();
      const rails = container.querySelectorAll('[data-aw="control-surface"]');
      expect(rails).toHaveLength(2);
      expect(container.querySelector('[data-aw="control-surface"][data-aw-side="left"]')).toBeInTheDocument();
      expect(container.querySelector('[data-aw="control-surface"][data-aw-side="bottom"]')).toBeInTheDocument();

      // Each registered dock renders a tab, a rounded drawer body, and a
      // dark-mode island inside the drawer that hosts the actual content.
      expect(container.querySelectorAll('[data-aw="control-surface-tab"]')).toHaveLength(2);
      expect(container.querySelectorAll('[data-aw="control-surface-body"]')).toHaveLength(2);
      expect(container.querySelectorAll('[data-aw="control-surface-island"]')).toHaveLength(2);

      // Consumer content lives inside the body.
      expect(screen.getByText('Left dock body')).toBeInTheDocument();
      expect(screen.getByText('Bottom dock body')).toBeInTheDocument();
    });

    test('caps drawer heights to the app window and scrolls drawer contents', () => {
      const { container } = render(
        <AppWindow
          id="dock"
          title="Dock"
          size={{ width: 600, height: 400 }}
          controlSurfaces={[
            { id: 'dock:left', side: 'left', children: <div>Left dock body</div> },
            {
              id: 'dock:bottom',
              side: 'bottom',
              height: 360,
              children: <div>Bottom dock body</div>,
            },
          ]}
        >
          <div>Body</div>
        </AppWindow>,
      );

      const bottom = container.querySelector<HTMLElement>(
        '[data-aw="control-surface"][data-aw-side="bottom"]',
      );
      expect(bottom?.style.height).toBe('200px');
      expect(bottom?.style.maxHeight).toBe('200px');

      const left = container.querySelector<HTMLElement>(
        '[data-aw="control-surface"][data-aw-side="left"]',
      );
      expect(left?.style.maxHeight).toBe('356px');

      const leftBody = container.querySelector<HTMLElement>(
        '[data-aw="control-surface"][data-aw-side="left"] [data-aw="control-surface-body"]',
      );
      expect(leftBody?.style.maxHeight).toBe('356px');
      expect(leftBody?.style.overflow).toBe('hidden');

      const leftScroll = container.querySelector<HTMLElement>(
        '[data-aw="control-surface"][data-aw-side="left"] [data-rdna="scrollarea"]',
      );
      expect(leftScroll?.className).toContain('overflow-y-auto');
      expect(leftScroll?.style.maxHeight).toBe('340px');
    });

    test('eject tab click fires onToggleSide with the rail side', async () => {
      const user = userEvent.setup();
      const onToggleSide = vi.fn();

      render(
        <AppWindow
          id="dock"
          title="Dock"
          controlSurfaces={[
            { id: 'dock:right', side: 'right', children: <div>Right dock</div> },
          ]}
          onToggleSide={onToggleSide}
        >
          <div>Body</div>
        </AppWindow>,
      );

      const tabButton = screen.getByRole('button', { name: 'Toggle right dock' });
      await user.click(tabButton);

      expect(onToggleSide).toHaveBeenCalledWith('right');
    });

    test('consumer-closed rails carry data-aw-peek="closed"', () => {
      const { container } = render(
        <AppWindow
          id="dock"
          title="Dock"
          controlSurfaces={[
            { id: 'dock:right', side: 'right', children: <div>Right</div>, isOpen: false },
            { id: 'dock:left', side: 'left', children: <div>Left</div> /* defaults open */ },
          ]}
        >
          <div>Body</div>
        </AppWindow>,
      );

      const right = container.querySelector('[data-aw-side="right"]');
      const left = container.querySelector('[data-aw-side="left"]');
      expect(right).toHaveAttribute('data-aw-peek', 'closed');
      expect(left).toHaveAttribute('data-aw-peek', 'open');
    });

    test('hideTab suppresses eject tabs and lets closed controlled rails unmount', () => {
      const { container } = render(
        <AppWindow
          id="dock"
          title="Dock"
          controlSurfaces={[
            { id: 'dock:right', side: 'right', children: <div>Right</div>, hideTab: true },
            {
              id: 'dock:left',
              side: 'left',
              children: <div>Left</div>,
              hideTab: true,
              isOpen: false,
            },
          ]}
        >
          <div>Body</div>
        </AppWindow>,
      );

      expect(container.querySelectorAll('[data-aw="control-surface-tab"]')).toHaveLength(0);
      expect(container.querySelector('[data-aw-surface-id="dock:right"]')).toBeInTheDocument();
      expect(container.querySelector('[data-aw-surface-id="dock:left"]')).not.toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
      expect(screen.queryByText('Left')).not.toBeInTheDocument();
    });

    test('omitting controlSurfaces renders no control-surface rails', () => {
      const { container } = render(
        <AppWindow id="plain" title="Plain">
          <div>Body</div>
        </AppWindow>,
      );

      // Standard windows always use the outer wrapper (for the drop-shadow
      // layer); it simply has no rail siblings when none are registered.
      expect(container.querySelectorAll('[data-aw="control-surface"]')).toHaveLength(0);
    });

    test('drawer rails inherit the ambient theme instead of forcing dark mode', () => {
      const { container } = render(
        <AppWindow
          id="dock"
          title="Dock"
          controlSurfaces={[
            { id: 'dock:left', side: 'left', children: <div>Body</div> },
          ]}
        >
          <div>Body</div>
        </AppWindow>,
      );

      const wrapper = container.querySelector('[data-aw="control-surface"]');
      expect(wrapper?.className).not.toContain('dark ');
      const body = container.querySelector('[data-aw="control-surface-body"]');
      expect(body?.className).not.toContain('bg-accent');
      expect(body?.className).toContain('pixel-rounded-8');
      const island = container.querySelector('[data-aw="control-surface-island"]');
      expect(island?.className).not.toContain('dark');
      expect(island?.className).not.toContain('bg-page');

      const tab = container.querySelector('[data-aw="control-surface-tab-button"]');
      expect(tab?.className).not.toContain('bg-accent');
      expect(tab?.className).not.toContain('text-inv');
    });
  });
});
