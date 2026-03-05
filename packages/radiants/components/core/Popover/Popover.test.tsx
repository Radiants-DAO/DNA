import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';

function TestPopover({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger asChild>
        <button>Open Popover</button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Popover content</p>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestPopover />);

    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Popover'));
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  test('trigger works without asChild', async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger>
          <span>Open Popover Text</span>
        </PopoverTrigger>
        <PopoverContent>
          <p>Popover text content</p>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText('Popover text content')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Popover Text'));
    expect(screen.getByText('Popover text content')).toBeInTheDocument();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestPopover defaultOpen />);

    expect(screen.getByText('Popover content')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  test('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <TestPopover defaultOpen />
        <button>Outside</button>
      </div>
    );

    expect(screen.getByText('Popover content')).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  test('preserves data-variant attribute', async () => {
    const user = userEvent.setup();
    render(<TestPopover />);

    await user.click(screen.getByText('Open Popover'));
    const content = screen.getByText('Popover content').closest('[data-variant="popover"]');
    expect(content).toBeInTheDocument();
  });

  test('supports controlled open state', async () => {
    const onOpenChange = vi.fn();

    function Controlled() {
      return (
        <Popover open={true} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <button>Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Controlled content</p>
          </PopoverContent>
        </Popover>
      );
    }

    render(<Controlled />);
    expect(screen.getByText('Controlled content')).toBeInTheDocument();
  });
});
