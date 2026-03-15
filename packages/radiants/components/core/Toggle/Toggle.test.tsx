import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  test('renders and is a button', () => {
    render(<Toggle>Power</Toggle>);
    expect(screen.getByRole('button', { name: 'Power' })).toBeInTheDocument();
  });

  test('initial aria-pressed reflects defaultPressed', () => {
    render(<Toggle defaultPressed>Power</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps styling in sync for uncontrolled usage after click', async () => {
    const user = userEvent.setup();
    render(<Toggle defaultPressed>Power</Toggle>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    // class must reflect unpressed state — this fails before the fix
    expect(button).not.toHaveClass('bg-action-primary');
  });

  test('controlled pressed prop drives styling', () => {
    render(<Toggle pressed={false} onPressedChange={() => {}}>Power</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button')).not.toHaveClass('bg-action-primary');
  });

  test('fires onPressedChange on click', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Power</Toggle>);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
