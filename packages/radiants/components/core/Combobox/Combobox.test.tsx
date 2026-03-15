import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox } from './Combobox';

const fruits = ['Apple', 'Banana', 'Mango', 'Melon'];

function TestCombobox({ onOpenChange }: { onOpenChange?: (open: boolean, eventDetails?: unknown) => void }) {
  return (
    <Combobox.Root onOpenChange={onOpenChange} items={fruits}>
      <Combobox.Input placeholder="Search fruit" />
      <Combobox.Portal>
        <Combobox.Popup>
          <Combobox.Status />
          {fruits.map((fruit) => <Combobox.Item key={fruit} value={fruit}>{fruit}</Combobox.Item>)}
        </Combobox.Popup>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('Combobox', () => {
  test('renders input', () => {
    render(<TestCombobox />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('Combobox.Status is exported in namespace', () => {
    expect(Combobox.Status).toBeDefined();
  });

  test('shows options on focus', async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  test('forwards onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestCombobox onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('combobox'));
    expect(onOpenChange).toHaveBeenCalled();
  });
});
