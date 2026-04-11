import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';

const fruits = ['Apple', 'Banana', 'Mango', 'Melon'];

function TestCombobox({
  disabled,
  onOpenChange,
}: {
  disabled?: boolean;
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
}) {
  return (
    <Combobox.Root disabled={disabled} onOpenChange={onOpenChange}>
      <Combobox.Input placeholder="Search fruit" />
      <Combobox.Portal>
        <Combobox.Popup>
          <Combobox.Status>Results available</Combobox.Status>
          {fruits.map((fruit) => <Combobox.Item key={fruit} value={fruit}>{fruit}</Combobox.Item>)}
        </Combobox.Popup>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('Combobox', () => {
  test('renders input', () => {
    const { container } = render(<TestCombobox />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(container.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(4);
  });

  test('Combobox.Status is exported in namespace', () => {
    expect(Combobox.Status).toBeDefined();
  });

  test('shows options on focus', async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(document.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(8);
  });

  test('forwards onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestCombobox onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('combobox'));
    expect(onOpenChange).toHaveBeenCalled();
  });

  test('propagates disabled from root to the combobox input', () => {
    render(<TestCombobox disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
