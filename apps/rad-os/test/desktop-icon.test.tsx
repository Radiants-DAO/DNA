import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopIcon } from '@/components/Rad_os/DesktopIcon';

const mockOpenWindow = vi.fn();
const mockIsWindowOpen = vi.fn<(appId: string) => boolean>();

vi.mock('@/hooks/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: mockOpenWindow,
    isWindowOpen: mockIsWindowOpen,
  }),
}));

describe('DesktopIcon', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockOpenWindow.mockReset();
    mockIsWindowOpen.mockReset();
    mockIsWindowOpen.mockReturnValue(false);
  });

  it('opens the window on click without toggle semantics', async () => {
    const user = userEvent.setup();

    render(<DesktopIcon appId="brand" label="Brand" icon={<span aria-hidden="true">B</span>} />);

    await user.click(screen.getByRole('button', { name: 'Brand' }));

    expect(mockOpenWindow).toHaveBeenCalledWith('brand');
  });

  it('reflects active state when the window is already open', () => {
    mockIsWindowOpen.mockReturnValue(true);

    render(<DesktopIcon appId="brand" label="Brand" icon={<span aria-hidden="true">B</span>} />);

    expect(screen.getByRole('button', { name: 'Brand' })).toHaveAttribute('data-state', 'selected');
  });
});
