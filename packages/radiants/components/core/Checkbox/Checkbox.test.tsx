import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, Radio } from './Checkbox';

describe('Checkbox', () => {
  test('renders with label', () => {
    render(<Checkbox label="Accept terms" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  test('fires onChange on click', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Toggle me" checked={false} onChange={onChange} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Toggle me'));
    expect(onChange).toHaveBeenCalled();
  });

  test('reflects checked state', () => {
    const { rerender } = render(
      <Checkbox label="Check" checked={false} onChange={() => {}} />,
    );
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();

    rerender(<Checkbox label="Check" checked={true} onChange={() => {}} />);
    expect(input).toBeChecked();
  });

  test('keyboard Space toggles checkbox', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Keyboard" checked={false} onChange={onChange} />);

    const user = userEvent.setup();
    const input = screen.getByRole('checkbox');
    input.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalled();
  });

  test('disabled checkbox does not fire onChange', async () => {
    const onChange = vi.fn();
    render(
      <Checkbox label="Disabled" checked={false} onChange={onChange} disabled />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Disabled'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Radio', () => {
  test('renders with label', () => {
    render(<Radio label="Option A" name="group" value="a" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  test('fires onChange on click', async () => {
    const onChange = vi.fn();
    render(
      <Radio label="Option A" name="group" value="a" checked={false} onChange={onChange} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalled();
  });

  test('reflects checked state', () => {
    const { rerender } = render(
      <Radio label="Option" name="g" value="a" checked={false} onChange={() => {}} />,
    );
    const input = screen.getByRole('radio');
    expect(input).not.toBeChecked();

    rerender(
      <Radio label="Option" name="g" value="a" checked={true} onChange={() => {}} />,
    );
    expect(input).toBeChecked();
  });

  test('disabled radio does not fire onChange', async () => {
    const onChange = vi.fn();
    render(
      <Radio label="Disabled" name="g" value="a" checked={false} onChange={onChange} disabled />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Disabled'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
