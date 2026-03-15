import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpPanel } from './HelpPanel';

function HelpPanelHarness() {
  const { state, actions } = HelpPanel.useHelpPanelState();
  return (
    <HelpPanel.Provider state={state} actions={actions}>
      <HelpPanel.Trigger>
        <button>Help</button>
      </HelpPanel.Trigger>
      <HelpPanel.Content title="Help">
        <p>Help content here</p>
      </HelpPanel.Content>
    </HelpPanel.Provider>
  );
}

describe('HelpPanel', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<HelpPanelHarness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Help'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Help content here')).toBeInTheDocument();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<HelpPanelHarness />);
    await user.click(screen.getByText('Help'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('trigger has correct accessible role', () => {
    render(<HelpPanelHarness />);
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  test('closes via close button', async () => {
    const user = userEvent.setup();
    render(<HelpPanelHarness />);
    await user.click(screen.getByText('Help'));
    await user.click(screen.getByLabelText('Close help panel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
