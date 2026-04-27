import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';
import React from 'react';

describe('Tooltip', () => {
  test('shows tooltip on hover and hides on unhover', async () => {
    const user = userEvent.setup();
    const { baseElement: _baseElement } = render(
      <Tooltip content="Helpful tip" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByText('Hover me'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Helpful tip');
    expect(tooltip).toHaveClass('pixel-rounded-4');
    expect(tooltip).toHaveClass('bg-inv');

    await user.unhover(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('shows tooltip on focus and hides on blur', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Focus tip" delay={0}>
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
    // The old code wrapped triggers in <div className="relative inline-flex">
    // Verify no such wrapper exists between the button and the document root
    expect(button.closest('.inline-flex')).toBeNull();
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
