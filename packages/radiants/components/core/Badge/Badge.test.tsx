import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  test('uses pixel-rounded and pixel-shadow tokens', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    const classTokens = badge.className.split(/\s+/);

    expect(badge.className).toContain('pixel-rounded-xs');
    expect(badge.className).toContain('pixel-shadow-raised');
    expect(classTokens).not.toContain('rounded-xs');
    expect(classTokens).not.toContain('shadow-raised');
  });
});
