import { render } from '@testing-library/react';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
  test('uses pixel-rounded styling on the group shell', () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroup.Item value="one">One</ToggleGroup.Item>
        <ToggleGroup.Item value="two">Two</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const group = container.querySelector('[data-slot="toggle-group"]');
    const classTokens = group?.className.split(/\s+/) ?? [];

    expect(group?.className).toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');
  });
});
