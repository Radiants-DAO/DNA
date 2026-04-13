import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, Radio, RadioGroup } from './Checkbox';

describe('Checkbox', () => {
  test('renders with label and the pixel-rounded checkbox shell', () => {
    render(<Checkbox label="Accept terms" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('pixel-rounded-xs');
    expect(checkbox).toHaveClass('bg-card');
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

describe('Checkbox extra contracts', () => {
  test('supports indeterminate state', () => {
    render(<Checkbox indeterminate label="Mixed" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  test('supports uncontrolled defaultChecked', async () => {
    const user = userEvent.setup();
    render(<Checkbox defaultChecked label="Default on" />);
    const cb = screen.getByRole('checkbox');
    expect(cb).toBeChecked();
    await user.click(cb);
    expect(cb).not.toBeChecked();
  });

  test('keepMounted keeps indicator in DOM when unchecked', () => {
    const { container } = render(<Checkbox label="KM" />);
    // Indicator element should remain in DOM even when unchecked
    expect(container.querySelector('[data-slot="indicator"]')).toBeInTheDocument();
  });
});

describe('RadioGroup', () => {
  test('arrow-key navigation moves between radios in the same group', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup value="one" onValueChange={vi.fn()}>
        <Radio value="one" label="One" />
        <Radio value="two" label="Two" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]);
    await user.keyboard('{ArrowDown}');
    expect(radios[1]).toHaveFocus();
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
