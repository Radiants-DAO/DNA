import { render, screen } from '@testing-library/react';
import { Button, buttonFaceVariants } from './Button';

describe('Button', () => {
  test('exposes selected state on the button face when active is true', () => {
    render(<Button variant="secondary" active>Launch</Button>);

    const face = screen.getByText('Launch').closest('[data-slot="button-face"]');

    expect(face).toHaveAttribute('data-variant', 'secondary');
    expect(face).toHaveAttribute('data-state', 'selected');
  });

  test('does not encode secondary selected colors with conflicting Tailwind token utilities', () => {
    const classes = buttonFaceVariants({
      variant: 'secondary',
      active: true,
    });

    expect(classes).not.toMatch(/\bbg-surface-primary\b/);
    expect(classes).not.toMatch(/\btext-content-primary\b/);
    expect(classes).not.toMatch(/\b!bg-surface-secondary\b/);
    expect(classes).not.toMatch(/\b!text-action-primary\b/);
    expect(classes).not.toMatch(/\b!border-surface-secondary\b/);
  });
});
