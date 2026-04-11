import { render, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  test('uses rounded fallback styling on the root and ghost controls', () => {
    const { container } = render(
      <Toolbar.Root>
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
      </Toolbar.Root>,
    );

    const root = container.querySelector('[data-rdna="toolbar"]');
    const button = screen.getByRole('button', { name: 'Bold' });
    const link = screen.getByRole('link', { name: 'Docs' });

    expect(root?.className).toContain('rounded-sm');
    expect(root?.className).toContain('border-line');
    expect(root?.className).not.toContain('pixel-rounded');
    expect(button.className).toContain('rounded-xs');
    expect(button.className).toContain('border-line');
    expect(button.className).not.toContain('pixel-rounded');
    expect(link.className).toContain('rounded-xs');
    expect(link.className).toContain('border-line');
    expect(link.className).not.toContain('pixel-rounded');
  });
});
