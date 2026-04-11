import { render } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  test('uses rounded fallback styling for square avatars', () => {
    const { container } = render(<Avatar shape="square" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');

    expect(avatar?.className).toContain('rounded-xs');
    expect(avatar?.className).toContain('border-line');
    expect(avatar?.className).not.toContain('pixel-rounded');
  });
});
