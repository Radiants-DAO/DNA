import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './DropdownMenu';

function TestDropdownMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button>Open Menu</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>Copy</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}} destructive>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Open Menu'));
  await waitFor(() => {
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
}

describe('DropdownMenu', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDropdownMenu />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await openMenu(user);
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestDropdownMenu />);

    await openMenu(user);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  test('renders menu items with menuitem role', async () => {
    const user = userEvent.setup();
    render(<TestDropdownMenu />);

    await openMenu(user);
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  test('closes menu when item is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await openMenu(user);
    await user.click(screen.getByText('Action'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('disabled item does not fire onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button>Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick} disabled>Disabled</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await openMenu(user);
    await user.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('renders separator', async () => {
    const user = userEvent.setup();
    render(<TestDropdownMenu />);

    await openMenu(user);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
