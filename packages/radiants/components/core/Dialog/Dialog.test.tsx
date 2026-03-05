import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, useDialogState } from './Dialog';

function TestDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { state, actions } = useDialogState({ defaultOpen });
  return (
    <Dialog.Provider state={state} actions={actions}>
      <Dialog.Trigger asChild>
        <button>Open Dialog</button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Test Title</Dialog.Title>
          <Dialog.Description>Test description</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <input data-testid="dialog-input" />
          <button>Inner Button</button>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <button>Close</button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Provider>
  );
}

describe('Dialog', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Dialog'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('trigger works without asChild', async () => {
    const user = userEvent.setup();

    function WithoutAsChild() {
      const { state, actions } = useDialogState();
      return (
        <Dialog.Provider state={state} actions={actions}>
          <Dialog.Trigger>
            <span>Open Dialog Text</span>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>No asChild content</Dialog.Body>
          </Dialog.Content>
        </Dialog.Provider>
      );
    }

    render(<WithoutAsChild />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Dialog Text'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByText('Close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes on backdrop click', async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Click the backdrop overlay behind the dialog
    const backdrop = document.querySelector('.bg-surface-overlay-medium');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders title and description', async () => {
    render(<TestDialog defaultOpen />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('useDialogState supports controlled open', () => {
    const onOpenChange = vi.fn();
    function Controlled() {
      const { state, actions } = useDialogState({ open: true, onOpenChange });
      return (
        <Dialog.Provider state={state} actions={actions}>
          <Dialog.Content>
            <Dialog.Body>Controlled content</Dialog.Body>
          </Dialog.Content>
        </Dialog.Provider>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
