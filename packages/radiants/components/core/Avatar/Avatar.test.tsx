import { render } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  test('uses pixel-rounded styling for square avatars', () => {
    const { container } = render(<Avatar shape="square" fallback="RM" />);
    const avatar = container.querySelector('[data-rdna="avatar"]');
    const classTokens = avatar?.className.split(/\s+/) ?? [];

    expect(avatar?.className).toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
  });
});
