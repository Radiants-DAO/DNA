import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppWindow } from '@/components/Rad_os/AppWindow';
import { useRadOSStore } from '@/store';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}


describe('RadOS AppWindow', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    localStorage.clear();
    useRadOSStore.setState({ windows: [], nextZIndex: 1 });
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
    document.documentElement.style.fontSize = '16px';
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders from store state and closes through the wrapper handlers', async () => {
    const user = userEvent.setup();

    useRadOSStore.getState().openWindow('brand');

    render(
      <AppWindow id="brand" title="Brand">
        <div>Brand body</div>
      </AppWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'Brand' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close Brand' }));

    await waitFor(() => {
      expect(useRadOSStore.getState().getWindow('brand')?.isOpen).toBe(false);
    });

    expect(screen.queryByRole('dialog', { name: 'Brand' })).not.toBeInTheDocument();
  });

  it('toggles fullscreen through the store-backed title bar control', async () => {
    const user = userEvent.setup();

    useRadOSStore.getState().openWindow('brand');

    render(
      <AppWindow id="brand" title="Brand">
        <div>Brand body</div>
      </AppWindow>,
    );

    await user.click(screen.getByRole('button', { name: 'Enter fullscreen Brand' }));

    await waitFor(() => {
      expect(useRadOSStore.getState().getWindow('brand')?.isFullscreen).toBe(true);
    });

    expect(screen.getByRole('dialog', { name: 'Brand' })).toHaveAttribute('data-fullscreen', 'true');
  });
});
