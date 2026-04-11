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
  test('uses pixel-rounded styling on the root bar', () => {
    const { container } = render(<TestMenubar />);
    const root = container.querySelector('[data-rdna="menubar"]');
    const classTokens = root?.className.split(/\s+/) ?? [];

    expect(root?.className).toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
  });

  test('renders menu content inside a PixelBorder shell', async () => {
    const user = userEvent.setup();
    render(<TestMenubar />);

    await user.click(screen.getByText('File'));
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(4);
  });
});
