import { render, screen } from '@testing-library/react';
import { Button, buttonFaceVariants } from './Button';

describe('Button', () => {
  test('exposes selected state on the button face when active is true', () => {
    render(<Button variant="secondary" active>Launch</Button>);

    const face = screen.getByText('Launch').closest('[data-slot="button-face"]');

    expect(face).toHaveAttribute('data-variant', 'secondary');
    expect(face).toHaveAttribute('data-state', 'selected');
  });

  test('supports focusableWhenDisabled — uses aria-disabled instead of native disabled', () => {
    render(<Button disabled focusableWhenDisabled>Open</Button>);
    const btn = screen.getByRole('button', { name: 'Open' });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  test('does not encode secondary colors with conflicting Tailwind token utilities', () => {
    const classes = buttonFaceVariants({
      variant: 'secondary',
    });

    expect(classes).not.toMatch(/\bbg-page\b/);
    expect(classes).not.toMatch(/\btext-main\b/);
    expect(classes).not.toMatch(/\b!bg-inv\b/);
    expect(classes).not.toMatch(/\b!text-accent\b/);
    expect(classes).not.toMatch(/\b!border-inv\b/);
  });
});
