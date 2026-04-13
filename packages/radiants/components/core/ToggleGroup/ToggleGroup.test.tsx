import { render } from '@testing-library/react';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
  test('renders the group shell with the pixel-rounded xs class', () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroup.Item value="one">One</ToggleGroup.Item>
        <ToggleGroup.Item value="two">Two</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const group = container.querySelector('[data-slot="toggle-group"]');

    expect(group).toHaveClass('pixel-rounded-xs');
  });
});
