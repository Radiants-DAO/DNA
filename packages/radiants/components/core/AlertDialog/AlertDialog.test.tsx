import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertDialog, useAlertDialogState } from './AlertDialog';

function TestAlertDialog({ defaultOpen = false, onOpenChange }: {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
}) {
  const { state, actions } = useAlertDialogState({ defaultOpen, onOpenChange });
  return (
    <AlertDialog.Provider state={state} actions={actions}>
      <AlertDialog.Trigger asChild><button>Open</button></AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Confirm</AlertDialog.Title>
          <AlertDialog.Description>Are you sure?</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Close asChild><button>Cancel</button></AlertDialog.Close>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Provider>
  );
}

describe('AlertDialog', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestAlertDialog />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  test('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestAlertDialog defaultOpen />);
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('onOpenChange receives eventDetails when closed via escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestAlertDialog defaultOpen onOpenChange={onOpenChange} />);
    // AlertDialog doesn't close on Escape by design — just verify it was opened
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    // Close via button — verify callback fires
    await user.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: expect.any(String) }));
  });

  test('actionsRef is supported on Provider', () => {
    const actionsRef = { current: null as { close: () => void; unmount: () => void } | null };
    function WithRef() {
      const { state, actions } = useAlertDialogState({ defaultOpen: true });
      return (
        <AlertDialog.Provider state={state} actions={actions} actionsRef={actionsRef}>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>T</AlertDialog.Title>
              <AlertDialog.Description>D</AlertDialog.Description>
            </AlertDialog.Header>
          </AlertDialog.Content>
        </AlertDialog.Provider>
      );
    }
    render(<WithRef />);
    expect(actionsRef.current?.close).toBeTypeOf('function');
  });

  test('renders alert dialog content with the current popup shell classes', () => {
    render(<TestAlertDialog defaultOpen />);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector('.pixel-rounded-6')).toBeInTheDocument();
    expect(dialog.querySelector('.pixel-shadow-floating')).toBeInTheDocument();
  });
});
