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

  test('selected state is "selected" when pressed, "default" when not', () => {
    render(<Toggle defaultPressed>Power</Toggle>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-state', 'selected');
  });

  test('data-state reflects unpressed after click', async () => {
    const user = userEvent.setup();
    render(<Toggle defaultPressed>Power</Toggle>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-state', 'selected');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-state', 'default');
  });

  test('controlled pressed prop drives aria-pressed and data-state', () => {
    render(<Toggle pressed={false} onPressedChange={() => {}}>Power</Toggle>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-state', 'default');
  });

  test('fires onPressedChange on click', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Power</Toggle>);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  test('renders face span with button-face slot and data-mode', () => {
    const { container } = render(<Toggle mode="solid">Power</Toggle>);
    const face = container.querySelector('[data-slot="button-face"]');
    expect(face).toBeInTheDocument();
    expect(face).toHaveAttribute('data-mode', 'solid');
  });

  test('face data-state matches pressed state', async () => {
    const user = userEvent.setup();
    const { container } = render(<Toggle>Power</Toggle>);
    const face = container.querySelector('[data-slot="button-face"]');
    expect(face).toHaveAttribute('data-state', 'default');

    await user.click(screen.getByRole('button'));
    expect(face).toHaveAttribute('data-state', 'selected');
  });
});
