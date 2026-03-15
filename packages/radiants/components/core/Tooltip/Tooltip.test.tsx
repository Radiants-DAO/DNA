import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';
import React from 'react';

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

  test('does not inject a div wrapper around button triggers', () => {
    render(
      <Tooltip content="Info">
        <button>Open</button>
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Open' });
    // The button's parent should NOT be a div injected by the tooltip wrapper
    expect(button.parentElement?.tagName).not.toBe('DIV');
  });

  test('Tooltip.Provider is exported and shares delay across instances', async () => {
    expect(Tooltip.Provider).toBeDefined();
    const user = userEvent.setup();
    render(
      <Tooltip.Provider delay={0}>
        <Tooltip content="One"><button>One</button></Tooltip>
        <Tooltip content="Two"><button>Two</button></Tooltip>
      </Tooltip.Provider>,
    );
    await user.hover(screen.getByRole('button', { name: 'One' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('One');
  });
});
