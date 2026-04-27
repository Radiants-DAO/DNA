import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('applies the pixel-rounded xs shell to the trigger and content surfaces', async () => {
    const user = userEvent.setup();
    const { container: _container } = render(
      <Collapsible.Root>
        <Collapsible.Trigger>Section</Collapsible.Trigger>
        <Collapsible.Content>Panel body</Collapsible.Content>
      </Collapsible.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Section' });
    expect(trigger).toHaveClass('pixel-rounded-4');

    await user.click(trigger);

    const panelBody = screen.getByText('Panel body');
    expect(panelBody).toBeInTheDocument();
    expect(panelBody.closest('.pixel-rounded-4')).toBeInTheDocument();
  });
});
