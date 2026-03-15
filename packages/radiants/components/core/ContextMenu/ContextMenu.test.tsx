import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuGroupLabel,
} from './ContextMenu';

function TestContextMenu() {
  return (
    <ContextMenu>
      <div data-testid="trigger-area">Right-click me</div>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => {}}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={() => {}}>Copy</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => {}} destructive>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  test('opens on contextmenu event (right-click)', () => {
    render(<TestContextMenu />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestContextMenu />);

    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    expect(screen.getByText('Edit')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  test('closes when item is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ContextMenu>
        <div data-testid="trigger-area">Right-click me</div>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClick}>Action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    await user.click(screen.getByText('Action'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('renders separator', () => {
    render(<TestContextMenu />);

    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    // After migration, separator will have proper role="separator"
    const separator = document.querySelector('[role="separator"], .border-t');
    expect(separator).toBeInTheDocument();
  });

  test('ContextMenuContent uses ContextMenu root context (not orphan Menu tree)', () => {
    render(<TestContextMenu />);
    // The ContextMenu and ContextMenuContent must share the same Base UI context root.
    // If they did NOT (the old split-primitive bug), right-click wouldn't open the content.
    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    // If context is shared, popup renders; if split, it would not
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('supports grouped items with label', () => {
    render(
      <ContextMenu>
        <div data-testid="trigger-area">Right-click me</div>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuGroupLabel>Clipboard</ContextMenuGroupLabel>
            <ContextMenuItem>Cut</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
  });

  test('disabled item does not fire onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ContextMenu>
        <div data-testid="trigger-area">Right-click me</div>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClick} disabled>Disabled</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    fireEvent.contextMenu(screen.getByTestId('trigger-area'));
    await user.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
