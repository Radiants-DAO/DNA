import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer, useDrawerState } from './Drawer';

function TestDrawer({ defaultOpen = false, onOpenChange }: {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
}) {
  const { state, actions } = useDrawerState({ defaultOpen, onOpenChange });
  return (
    <Drawer.Provider state={state} actions={actions}>
      <Drawer.Trigger asChild><button>Open</button></Drawer.Trigger>
      <Drawer.Content>
        <p>Drawer content</p>
        <Drawer.Close asChild><button>Close</button></Drawer.Close>
      </Drawer.Content>
    </Drawer.Provider>
  );
}

describe('Drawer', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDrawer />);
    expect(screen.queryByText('Drawer content')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  test('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDrawer defaultOpen />);
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
    await user.click(screen.getByText('Close'));
    expect(screen.queryByText('Drawer content')).not.toBeInTheDocument();
  });

  test('forwards eventDetails signature in useDrawerState', () => {
    const onOpenChange = vi.fn<[boolean, unknown?]>();
    const { actions } = useDrawerState({ onOpenChange });
    actions.setOpen(true, { reason: 'test' });
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'test' });
  });

  test('actionsRef is supported on Provider', () => {
    const actionsRef = { current: null as { close: () => void; unmount: () => void } | null };
    function WithRef() {
      const { state, actions } = useDrawerState({ defaultOpen: true });
      return (
        <Drawer.Provider state={state} actions={actions} actionsRef={actionsRef}>
          <Drawer.Content><p>content</p></Drawer.Content>
        </Drawer.Provider>
      );
    }
    render(<WithRef />);
    expect(actionsRef.current?.close).toBeTypeOf('function');
  });
});
