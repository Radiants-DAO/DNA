import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose } from './Sheet';

function TestSheet({
  defaultOpen = false,
  side = 'right' as const,
}: {
  defaultOpen?: boolean;
  side?: 'left' | 'right' | 'top' | 'bottom';
}) {
  return (
    <Sheet defaultOpen={defaultOpen} side={side}>
      <SheetTrigger>
        <button>Open Sheet</button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <input data-testid="sheet-input" />
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <button>Close</button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

describe('Sheet', () => {
  test('opens when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestSheet />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open Sheet'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestSheet defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestSheet defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByText('Close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes on backdrop click', async () => {
    const user = userEvent.setup();
    render(<TestSheet defaultOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Click the backdrop overlay behind the sheet
    const backdrop = document.querySelector('.bg-surface-overlay-medium');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<TestSheet defaultOpen />);

    expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    expect(screen.getByText('Sheet description')).toBeInTheDocument();
  });

  test('renders with different sides', () => {
    const { rerender } = render(<TestSheet defaultOpen side="left" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<TestSheet defaultOpen side="bottom" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
