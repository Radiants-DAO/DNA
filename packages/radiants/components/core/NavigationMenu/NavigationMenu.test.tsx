import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationMenu } from './NavigationMenu';

function TestNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <div>Flyout content</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/about">About</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport />
    </NavigationMenu.Root>
  );
}

describe('NavigationMenu', () => {
  test('wraps triggers and links in PixelBorder (xs radius)', () => {
    const { container } = render(<TestNavigationMenu />);

    const trigger = screen.getByText('Products').closest('button');
    const link = screen.getByRole('link', { name: 'About' });
    const triggerTokens = trigger?.className.split(/\s+/) ?? [];
    const linkTokens = link.className.split(/\s+/);

    expect(triggerTokens).not.toContain('pixel-rounded-xs');
    expect(triggerTokens).not.toContain('rounded-xs');
    expect(linkTokens).not.toContain('pixel-rounded-xs');
    expect(linkTokens).not.toContain('rounded-xs');

    // Trigger and Link are each wrapped in a PixelBorder (xs = radius 4).
    // Expect at least 8 corner SVGs (4 per wrapped element).
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(8);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });

  test('renders viewport content inside a PixelBorder shell', async () => {
    const user = userEvent.setup();
    render(<TestNavigationMenu />);

    await user.click(screen.getByText('Products'));
    await waitFor(() => {
      expect(screen.getByText('Flyout content')).toBeInTheDocument();
    });
    // Viewport is wrapped in PixelBorder size="xs" (radius 4).
    expect(document.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(4);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(document.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });
});
