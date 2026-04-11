import { render } from '@testing-library/react';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
  test('uses rounded fallback styling on the group shell', () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroup.Item value="one">One</ToggleGroup.Item>
        <ToggleGroup.Item value="two">Two</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const group = container.querySelector('[data-slot="toggle-group"]');

    expect(group?.className).toContain('rounded-xs');
    expect(group?.className).toContain('border-line');
    expect(group?.className).not.toContain('pixel-rounded');
  });
});
