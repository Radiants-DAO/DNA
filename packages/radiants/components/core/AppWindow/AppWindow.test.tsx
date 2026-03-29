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
});
