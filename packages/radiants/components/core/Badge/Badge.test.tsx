import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  test('uses rounded fallback and standard shadow tokens', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');

    expect(badge.className).toContain('rounded-xs');
    expect(badge.className).toContain('shadow-raised');
    expect(badge.className).not.toContain('pixel-rounded');
    expect(badge.className).not.toContain('pixel-shadow');
  });
});
