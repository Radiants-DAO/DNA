import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('exposes selected state on the button face when active is true', () => {
    render(<Button quiet active>Launch</Button>);

    const face = screen.getByText('Launch').closest('[data-slot="button-face"]');

    expect(face).toHaveAttribute('data-quiet');
    expect(face).toHaveAttribute('data-state', 'selected');
  });

  test('tone="danger" sets data-color on solid variant', () => {
    render(<Button tone="danger">Delete</Button>);

    const face = screen.getByText('Delete').closest('[data-slot="button-face"]');

    expect(face).toHaveAttribute('data-variant', 'solid');
    expect(face).toHaveAttribute('data-color', 'danger');
  });

  test('emits data-color from tone prop', () => {
    render(<Button tone="success">Save</Button>);

    const face = screen.getByText('Save').closest('[data-slot="button-face"]');

    expect(face).toHaveAttribute('data-variant', 'solid');
    expect(face).toHaveAttribute('data-color', 'success');
  });

  test('supports focusableWhenDisabled — uses aria-disabled instead of native disabled', () => {
    render(<Button disabled focusableWhenDisabled>Open</Button>);
    const btn = screen.getByRole('button', { name: 'Open' });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  test('forwards anchor props when rendered as a link', () => {
    render(
      <Button
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open docs"
      >
        Docs
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Open docs' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('wraps the button face in a PixelBorder with xs corners by default', () => {
    const { container } = render(<Button>Rounded</Button>);
    const face = screen.getByText('Rounded').closest('[data-slot="button-face"]');
    const classTokens = face?.className.split(/\s+/) ?? [];

    // Legacy pixel-rounded class is gone from the face span itself.
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');

    // PixelBorder size="xs" renders four corner SVGs with viewBox 0 0 4 4.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
    // Face is inside the PixelBorder wrapped-mode clipper.
    expect(face?.closest('.overflow-hidden')).toBeInTheDocument();
  });

  test('size variants render size-matched pixel corners', () => {
    const cases: Array<{ rounded: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; size: number }> = [
      { rounded: 'xs', size: 4 },
      { rounded: 'sm', size: 6 },
      { rounded: 'md', size: 8 },
      { rounded: 'lg', size: 12 },
      { rounded: 'xl', size: 20 },
    ];

    for (const { rounded, size } of cases) {
      const { container, unmount } = render(<Button rounded={rounded}>R-{rounded}</Button>);
      expect(
        container.querySelectorAll(`svg[viewBox="0 0 ${size} ${size}"]`),
      ).toHaveLength(4);
      unmount();
    }
  });

  test('rounded="none" skips the PixelBorder wrap entirely', () => {
    const { container } = render(
      <Button rounded="none">Square</Button>,
    );
    // No corner SVGs of any preset radius are rendered.
    for (const r of [4, 6, 8, 12, 20]) {
      expect(container.querySelectorAll(`svg[viewBox="0 0 ${r} ${r}"]`)).toHaveLength(0);
    }
  });

  test('mode="text" forces rounded="none" and skips the PixelBorder wrap', () => {
    const { container } = render(<Button mode="text">Go</Button>);
    for (const r of [4, 6, 8, 12, 20]) {
      expect(container.querySelectorAll(`svg[viewBox="0 0 ${r} ${r}"]`)).toHaveLength(0);
    }
  });
});
