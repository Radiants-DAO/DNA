import { render, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  test('wraps the root and ghost controls in PixelBorder', () => {
    const { container } = render(
      <Toolbar.Root>
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Link href="/docs">Docs</Toolbar.Link>
      </Toolbar.Root>,
    );

    const root = container.querySelector('[data-rdna="toolbar"]');
    const button = screen.getByRole('button', { name: 'Bold' });
    const link = screen.getByRole('link', { name: 'Docs' });
    const rootTokens = root?.className.split(/\s+/) ?? [];
    const buttonTokens = button.className.split(/\s+/);
    const linkTokens = link.className.split(/\s+/);

    expect(rootTokens).not.toContain('pixel-rounded-sm');
    expect(buttonTokens).not.toContain('pixel-rounded-xs');
    expect(linkTokens).not.toContain('pixel-rounded-xs');

    // Root is wrapped in PixelBorder size="sm" (radius 6) — 4 corner SVGs.
    expect(container.querySelectorAll('svg[viewBox="0 0 6 6"]').length).toBeGreaterThanOrEqual(4);
    // Button + Link are each wrapped in PixelBorder size="xs" (radius 4) —
    // at least 8 corner SVGs between them.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]').length).toBeGreaterThanOrEqual(8);
  });
});
