import { render, screen, waitFor } from '@testing-library/react';
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
      <DropdownMenuTrigger asChild>
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

  test('trigger works without asChild', async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span>Open Menu Text</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Menu Text'));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
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
        <DropdownMenuTrigger asChild>
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
        <DropdownMenuTrigger asChild>
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

  test('supports checkbox item', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button>Open</button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => {}}>Bold</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await openMenu(user);
    expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
  });

  test('supports grouped items with label', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button>Open</button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuGroupLabel>Clipboard</DropdownMenuGroupLabel>
            <DropdownMenuItem>Cut</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await openMenu(user);
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
  });

  test('renders separator', async () => {
    const user = userEvent.setup();
    render(<TestDropdownMenu />);

    await openMenu(user);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
