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
  test('renders triggers and links with the pixel-rounded xs shell', () => {
    const { container } = render(<TestNavigationMenu />);

    const trigger = screen.getByText('Products').closest('button');
    const link = screen.getByRole('link', { name: 'About' });

    expect(trigger).toHaveClass('pixel-rounded-4');
    expect(link).toHaveClass('pixel-rounded-4');
    expect(container.querySelector('[data-rdna="navigationmenu"]')).toBeInTheDocument();
  });

  test('renders viewport content with the rounded popup shell classes', async () => {
    const user = userEvent.setup();
    render(<TestNavigationMenu />);

    await user.click(screen.getByText('Products'));
    await waitFor(() => {
      expect(screen.getByText('Flyout content')).toBeInTheDocument();
    });
    expect(screen.getByText('Flyout content').closest('.pixel-rounded-4')).toBeInTheDocument();
    expect(screen.getByText('Flyout content').closest('.pixel-shadow-raised')).toBeInTheDocument();
  });
});
