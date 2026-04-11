import { render, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  test('uses pixel-rounded styling on the root and ghost controls', () => {
    const { container } = render(
      <Toolbar.Root>
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
      </Toolbar.Root>,
    );

    const root = container.querySelector('[data-rdna="toolbar"]');
    const button = screen.getByRole('button', { name: 'Bold' });
    const link = screen.getByRole('link', { name: 'Docs' });

    expect(root?.className).toContain('pixel-rounded-sm');
    expect(button.className).toContain('pixel-rounded-xs');
    expect(link.className).toContain('pixel-rounded-xs');
  });
});
