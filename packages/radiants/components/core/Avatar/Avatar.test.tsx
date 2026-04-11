import { render } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  test('wraps square avatars in a PixelBorder with xs corners', () => {
    const { container } = render(<Avatar shape="square" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');
    const classTokens = avatar?.className.split(/\s+/) ?? [];

    // Legacy pixel-rounded class should no longer live on the Root.
    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');

    // Square avatars are wrapped by <PixelBorder size="xs"> — four corner SVGs (viewBox 0 0 4 4).
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
  });

  test('circle shape stays unwrapped and keeps the border-radius styling', () => {
    const { container } = render(<Avatar shape="circle" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');
    expect(avatar?.className).toContain('rounded-full');
    // No PixelBorder wrapping for circle — no corner SVGs.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(0);
  });
});
