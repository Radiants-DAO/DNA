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
  test('uses rounded fallback styling on triggers and links', () => {
    render(<TestNavigationMenu />);

    const trigger = screen.getByText('Products').closest('button');
    const link = screen.getByRole('link', { name: 'About' });

    expect(trigger?.className).toContain('rounded-xs');
    expect(trigger?.className).toContain('border-line');
    expect(trigger?.className).not.toContain('pixel-rounded');
    expect(link.className).toContain('rounded-xs');
    expect(link.className).toContain('border-line');
    expect(link.className).not.toContain('pixel-rounded');
  });

  test('renders viewport content inside a PixelBorder shell', async () => {
    const user = userEvent.setup();
    render(<TestNavigationMenu />);

    await user.click(screen.getByText('Products'));
    await waitFor(() => {
      expect(screen.getByText('Flyout content')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(4);
  });
});
