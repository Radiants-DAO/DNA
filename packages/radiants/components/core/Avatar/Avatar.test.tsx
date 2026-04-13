import { render } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  test('wraps square avatars in the pixel-rounded xs shell', () => {
    const { container } = render(<Avatar shape="square" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');

    expect(avatar).toBeInTheDocument();
    expect(avatar?.parentElement).toHaveClass('pixel-rounded-xs');
    expect(avatar).toHaveAttribute('data-shape', 'square');
  });

  test('circle shape stays unwrapped and keeps the border-radius styling', () => {
    const { container } = render(<Avatar shape="circle" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');
    expect(avatar?.className).toContain('rounded-full');
    expect(avatar?.parentElement).not.toHaveClass('pixel-rounded-xs');
  });
});
