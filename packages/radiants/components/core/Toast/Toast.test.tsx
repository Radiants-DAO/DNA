import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

function TestToastTrigger() {
  const { addToast } = useToast();
  return (
    <button
      onClick={() =>
        addToast({ title: 'Test toast', description: 'Toast description', variant: 'success' })
      }
    >
      Show Toast
    </button>
  );
}

function TestApp() {
  return (
    <ToastProvider defaultDuration={0}>
      <TestToastTrigger />
    </ToastProvider>
  );
}

describe('Toast', () => {
  test('toast appears with role=alert when triggered', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByText('Show Toast'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test toast')).toBeInTheDocument();
    expect(screen.getByText('Toast description')).toBeInTheDocument();
  });

  test('toast dismisses via close button', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('useToast throws outside ToastProvider', () => {
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow('useToast must be used within a ToastProvider');
  });
});
