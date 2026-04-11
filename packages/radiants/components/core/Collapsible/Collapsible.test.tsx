import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('uses pixel-rounded styling on trigger and content shells', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Collapsible.Root>
        <Collapsible.Trigger>Section</Collapsible.Trigger>
        <Collapsible.Content>Panel body</Collapsible.Content>
      </Collapsible.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Section' });
    expect(trigger.className).toContain('pixel-rounded-xs');

    await user.click(trigger);
    const panel = screen.getByText('Panel body').closest('.pixel-rounded-xs');
    expect(panel?.className).toContain('pixel-rounded-xs');
    expect(container.querySelector('.pixel-rounded-xs')).toBeInTheDocument();
  });
});
