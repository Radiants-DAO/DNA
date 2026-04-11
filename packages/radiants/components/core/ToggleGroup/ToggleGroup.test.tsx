import { render } from '@testing-library/react';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
  test('wraps the group shell with a PixelBorder', () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroup.Item value="one">One</ToggleGroup.Item>
        <ToggleGroup.Item value="two">Two</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const group = container.querySelector('[data-slot="toggle-group"]');
    const classTokens = group?.className.split(/\s+/) ?? [];

    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
    // PixelBorder renders four 4x4 corner SVGs around the group shell.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
  });
});
