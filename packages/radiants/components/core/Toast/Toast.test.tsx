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

    await user.click(screen.getByLabelText('Close alert'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not expose stale toast count through useToast', async () => {
    function ToastCountHarness() {
      const { toasts, addToast } = useToast();
      return (
        <div>
          <button onClick={() => addToast({ title: 'Hi' })}>Add</button>
          <span data-testid="toast-count">{toasts.length}</span>
        </div>
      );
    }
    const user = userEvent.setup();
    render(<ToastProvider defaultDuration={0}><ToastCountHarness /></ToastProvider>);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    await user.click(screen.getByText('Add'));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  test('useToast exposes update and promise methods', async () => {
    function ToastUpdateHarness() {
      const { update, promise } = useToast();
      return <button onClick={() => { expect(update).toBeTypeOf('function'); expect(promise).toBeTypeOf('function'); }}>Check</button>;
    }
    const user = userEvent.setup();
    render(<ToastProvider><ToastUpdateHarness /></ToastProvider>);
    await user.click(screen.getByText('Check'));
  });

  test('Toast.Action is exported from Toast module', async () => {
    const mod = await import('./Toast');
    expect((mod as Record<string, unknown>).ToastAction).toBeDefined();
  });

  test('useToast throws outside ToastProvider', () => {
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow('useToast must be used within a ToastProvider');
  });
});
