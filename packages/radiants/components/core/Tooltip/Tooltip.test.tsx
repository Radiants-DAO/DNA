import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  test('shows tooltip on hover and hides on unhover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Helpful tip">
        <button>Hover me</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByText('Hover me'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful tip');

    await user.unhover(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('shows tooltip on focus and hides on blur', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Focus tip">
        <button>Focus me</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus tip');

    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('renders children as trigger', () => {
    render(
      <Tooltip content="Tip">
        <button>Trigger</button>
      </Tooltip>,
    );

    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });
});
