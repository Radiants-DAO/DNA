import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from '@/components/Rad_os/CommandPalette';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('@/hooks/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn(),
  }),
}));

describe('CommandPalette', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the popup with a dedicated shell and surface split', async () => {
    const user = userEvent.setup();

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    render(<CommandPalette />);
    await user.keyboard('{Meta>}k{/Meta}');

    await waitFor(() => {
      expect(document.querySelector('[cmdk-root].cmdk-shell')).toBeInTheDocument();
    });
    expect(document.querySelector('[cmdk-root].cmdk-shell > .cmdk-surface')).toBeInTheDocument();
  });

  it('uses checkerboard overlay styling in globals.css', () => {
    const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8');

    expect(css).toContain('mask-image: var(--pat-checkerboard)');
  });
});
