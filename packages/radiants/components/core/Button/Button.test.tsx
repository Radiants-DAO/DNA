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

  test('applies the default xs pixel-rounded class to the button face', () => {
    render(<Button>Rounded</Button>);
    const face = screen.getByText('Rounded').closest('[data-slot="button-face"]');

    expect(face).toHaveClass('pixel-rounded-xs');
    expect(face).toHaveAttribute('data-variant', 'solid');
    expect(face).toHaveAttribute('data-state', 'default');
  });

  test('rounded variants map to the matching pixel-rounded classes', () => {
    const cases: Array<{ rounded: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className: string }> = [
      { rounded: 'xs', className: 'pixel-rounded-xs' },
      { rounded: 'sm', className: 'pixel-rounded-sm' },
      { rounded: 'md', className: 'pixel-rounded-md' },
      { rounded: 'lg', className: 'pixel-rounded-lg' },
      { rounded: 'xl', className: 'pixel-rounded-xl' },
    ];

    for (const { rounded, className } of cases) {
      render(<Button rounded={rounded}>R-{rounded}</Button>);
      expect(screen.getByText(`R-${rounded}`).closest('[data-slot="button-face"]')).toHaveClass(className);
    }
  });

  test('rounded="none" removes the pixel-rounded class from the face', () => {
    render(<Button rounded="none">Square</Button>);
    const face = screen.getByText('Square').closest('[data-slot="button-face"]');
    expect(face?.className).not.toMatch(/\bpixel-rounded-/);
  });

  test('mode="text" forces rounded="none" on the face', () => {
    render(<Button mode="text">Go</Button>);
    const face = screen.getByText('Go').closest('[data-slot="button-face"]');
    expect(face?.className).not.toMatch(/\bpixel-rounded-/);
  });
});
