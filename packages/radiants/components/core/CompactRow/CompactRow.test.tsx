import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompactRowButton } from './CompactRow';

describe('CompactRowButton', () => {
  test('renders a dense button row with leading and trailing slots', () => {
    render(
      <CompactRowButton
        leading={<span data-testid="leading-slot">A</span>}
        trailing={<span data-testid="trailing-slot">12</span>}
      >
        Alpha
      </CompactRowButton>,
    );

    const button = screen.getByRole('button', { name: 'Alpha' });

    expect(button).toHaveAttribute('data-rdna', 'compact-row');
    expect(button).toHaveAttribute('data-state', 'default');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('pixel-rounded-4');
    expect(screen.getByTestId('leading-slot')).toBeInTheDocument();
    expect(screen.getByTestId('trailing-slot')).toBeInTheDocument();
  });

  test('exposes selected state for active rows', () => {
    render(<CompactRowButton selected>Selected row</CompactRowButton>);

    const button = screen.getByRole('button', { name: 'Selected row' });

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-state', 'selected');
  });

  test('supports disabled button semantics', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CompactRowButton disabled onClick={handleClick}>
        Disabled row
      </CompactRowButton>,
    );

    const button = screen.getByRole('button', { name: 'Disabled row' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
