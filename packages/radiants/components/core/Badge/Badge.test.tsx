import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  test('renders the badge span with the rounded and shadow utility classes', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');

    expect(badge).toHaveClass('pixel-rounded-4');
    expect(badge).toHaveClass('pixel-shadow-raised');
    expect(badge).toHaveAttribute('data-rdna', 'badge');
    expect(badge).toHaveAttribute('data-variant', 'default');
  });
});
