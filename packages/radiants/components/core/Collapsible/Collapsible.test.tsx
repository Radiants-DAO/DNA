import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('uses rounded fallback styling on trigger and content shells', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Collapsible.Root>
        <Collapsible.Trigger>Section</Collapsible.Trigger>
        <Collapsible.Content>Panel body</Collapsible.Content>
      </Collapsible.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Section' });
    expect(trigger.className).toContain('rounded-xs');
    expect(trigger.className).toContain('border-line');
    expect(trigger.className).not.toContain('pixel-rounded');

    await user.click(trigger);
    const panel = screen.getByText('Panel body').closest('.rounded-xs');
    expect(panel?.className).toContain('rounded-xs');
    expect(panel?.className).toContain('border-line');
    expect(panel?.className).not.toContain('pixel-rounded');
    expect(container.querySelector('.pixel-rounded-xs')).not.toBeInTheDocument();
  });
});
