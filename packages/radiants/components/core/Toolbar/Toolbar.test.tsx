import { render, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  test('renders the root and ghost controls with the expected rounded classes', () => {
    const { container } = render(
      <Toolbar.Root>
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
      </Toolbar.Root>,
    );

    const root = container.querySelector('[data-rdna="toolbar"]');
    const button = screen.getByRole('button', { name: 'Bold' });
    const link = screen.getByRole('link', { name: 'Docs' });

    expect(root).toHaveClass('pixel-rounded-sm');
    expect(button).toHaveClass('pixel-rounded-xs');
    expect(link).toHaveClass('pixel-rounded-xs');
    expect(container.querySelector('[data-slot="toolbar-button"]')).not.toBeInTheDocument();
  });
});
