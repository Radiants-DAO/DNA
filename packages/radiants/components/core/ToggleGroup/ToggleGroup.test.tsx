import { render } from '@testing-library/react';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
  test('renders the group shell as an inline-flex row by default', () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroup.Item value="one">One</ToggleGroup.Item>
        <ToggleGroup.Item value="two">Two</ToggleGroup.Item>
      </ToggleGroup>,
    );
    const group = container.querySelector('[data-slot="toggle-group"]');

    expect(group).toHaveClass('inline-flex');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
  });
});
