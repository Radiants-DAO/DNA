import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, useAccordionState } from './Accordion';

function TestAccordion({ type = 'single' as const }) {
  const { state, actions, meta } = useAccordionState({ type });

  return (
    <Accordion.Provider state={state} actions={actions} meta={meta}>
      <Accordion.Frame>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Section One</Accordion.Trigger>
          <Accordion.Content>Content One</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Section Two</Accordion.Trigger>
          <Accordion.Content>Content Two</Accordion.Content>
        </Accordion.Item>
      </Accordion.Frame>
    </Accordion.Provider>
  );
}

describe('Accordion', () => {
  test('renders triggers with aria-expanded false initially', () => {
    render(<TestAccordion />);

    const triggers = screen.getAllByRole('button');
    expect(triggers).toHaveLength(2);
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking trigger expands content and sets aria-expanded', async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);

    const trigger = screen.getByText('Section One').closest('button')!;
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('accordion items expose a scoped slot for theme styling', () => {
    render(<TestAccordion />);

    const item = screen.getByText('Section One').closest('[data-variant="accordion"]');
    expect(item).toHaveAttribute('data-slot', 'accordion-item');
  });

  test('Enter key toggles accordion item', async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);

    const trigger = screen.getByText('Section One').closest('button')!;
    trigger.focus();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Space key toggles accordion item', async () => {
    const user = userEvent.setup();
    render(<TestAccordion />);

    const trigger = screen.getByText('Section One').closest('button')!;
    trigger.focus();

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('single mode collapses other items when one opens', async () => {
    const user = userEvent.setup();
    render(<TestAccordion type="single" />);

    const trigger1 = screen.getByText('Section One').closest('button')!;
    const trigger2 = screen.getByText('Section Two').closest('button')!;

    await user.click(trigger1);
    expect(trigger1).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger2);
    expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    expect(trigger1).toHaveAttribute('aria-expanded', 'false');
  });
});
