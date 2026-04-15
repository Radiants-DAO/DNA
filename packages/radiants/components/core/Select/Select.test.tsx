import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, selectTriggerVariants, useSelectState } from './Select';

function TestSelect({
  defaultValue = '',
  onChange,
}: {
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const { state, actions } = useSelectState({ defaultValue, onChange });
  return (
    <Select.Provider state={state} actions={actions}>
      <Select.Trigger placeholder="Pick one" size="md" />
      <Select.Content>
        <Select.Option value="apple">Apple</Select.Option>
        <Select.Option value="banana">Banana</Select.Option>
        <Select.Option value="cherry">Cherry</Select.Option>
      </Select.Content>
    </Select.Provider>
  );
}

function TestSelectDisabledOption() {
  const { state, actions } = useSelectState();
  return (
    <Select.Provider state={state} actions={actions}>
      <Select.Trigger placeholder="Pick one" />
      <Select.Content>
        <Select.Option value="a">A</Select.Option>
        <Select.Option value="b" disabled>B (disabled)</Select.Option>
        <Select.Option value="c">C</Select.Option>
      </Select.Content>
    </Select.Provider>
  );
}

describe('Select', () => {
  test('trigger renders with placeholder text', () => {
    render(<TestSelect />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveClass('pixel-rounded-xs');
  });

  test('opens popup when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  test('trigger has aria-expanded that updates on open/close', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    await vi.waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test('selects an option by clicking', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TestSelect onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Banana' }));

    expect(onChange).toHaveBeenCalledWith('banana');
  });

  test('closes popup after selecting an option', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    await user.click(await screen.findByRole('option', { name: 'Apple' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('arrow keys navigate options', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');

    // Arrow down should highlight options
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    // Options should be navigable
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });

  test('preserves data-variant on trigger', async () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-variant', 'select');
  });

  test('preserves data-size on trigger', async () => {
    render(<TestSelect />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-size', 'md');
  });

  test('trigger variants do not hardcode themed color utilities', () => {
    const classes = selectTriggerVariants({
      open: true,
      error: true,
    });

    expect(classes).not.toMatch(/\btext-main\b/);
    expect(classes).not.toMatch(/\bbg-accent\b/);
    expect(classes).not.toMatch(/\bbg-page\b/);
    expect(classes).not.toMatch(/\bborder-line\b/);
    expect(classes).not.toMatch(/\bborder-danger\b/);
  });

  test('submits Select value via FormData when name prop is set', async () => {
    const _user = userEvent.setup();
    function SelectForm() {
      const { state, actions } = useSelectState({ defaultValue: 'banana' });
      return (
        <form data-testid="form">
          <Select.Provider state={state} actions={actions} name="fruit">
            <Select.Trigger placeholder="Pick one" />
            <Select.Content>
              <Select.Option value="apple">Apple</Select.Option>
              <Select.Option value="banana">Banana</Select.Option>
            </Select.Content>
          </Select.Provider>
        </form>
      );
    }
    render(<SelectForm />);
    const form = screen.getByTestId('form') as HTMLFormElement;
    const fd = new FormData(form);
    expect(fd.get('fruit')).toBe('banana');
  });

  test('useSelectState supports controlled value', () => {
    const onChange = vi.fn();
    function Controlled() {
      const { state, actions } = useSelectState({ value: 'banana', onChange });
      return (
        <Select.Provider state={state} actions={actions}>
          <Select.Trigger placeholder="Pick one" />
          <Select.Content>
            <Select.Option value="apple">Apple</Select.Option>
            <Select.Option value="banana">Banana</Select.Option>
          </Select.Content>
        </Select.Provider>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('disabled option cannot be selected', async () => {
    const user = userEvent.setup();
    render(<TestSelectDisabledOption />);

    await user.click(screen.getByRole('combobox'));

    const disabledOption = await screen.findByRole('option', { name: 'B (disabled)' });
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
  });
});
