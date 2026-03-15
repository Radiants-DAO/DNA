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

  test('useAlertDialogState onOpenChange receives eventDetails', () => {
    const onOpenChange = vi.fn<[boolean, unknown?]>();
    const { actions } = useAlertDialogState({ onOpenChange });
    actions.setOpen(false, { reason: 'escape-key' });
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'escape-key' });
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
});
