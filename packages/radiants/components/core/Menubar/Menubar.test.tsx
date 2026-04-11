import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menubar } from './Menubar';

function TestMenubar() {
  return (
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

describe('Menubar', () => {
  test('wraps the root bar in a PixelBorder (xs radius)', () => {
    const { container } = render(<TestMenubar />);
    const root = container.querySelector('[data-rdna="menubar"]');
    const classTokens = root?.className.split(/\s+/) ?? [];

    expect(root).toBeInTheDocument();
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
    // PixelBorder xs renders 4 corner SVGs with viewBox="0 0 4 4".
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(4);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });

  test('renders menu content inside a PixelBorder shell', async () => {
    const user = userEvent.setup();
    render(<TestMenubar />);

    await user.click(screen.getByText('File'));
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
    // Menubar.Content uses PixelBorder size="xs" (radius 4) for the popup.
    expect(document.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(4);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(document.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });
});
