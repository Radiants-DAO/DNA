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
  test('renders the root bar with the pixel-rounded xs shell', () => {
    const { container } = render(<TestMenubar />);
    const root = container.querySelector('[data-rdna="menubar"]');

    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('pixel-rounded-xs');
    expect(root).toHaveClass('bg-inv');
  });

  test('renders menu content with the rounded popup shell classes', async () => {
    const user = userEvent.setup();
    render(<TestMenubar />);

    await user.click(screen.getByText('File'));
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
    expect(screen.getByText('New').closest('.pixel-rounded-xs')).toBeInTheDocument();
    expect(screen.getByText('New').closest('.pixel-shadow-raised')).toBeInTheDocument();
  });
});
