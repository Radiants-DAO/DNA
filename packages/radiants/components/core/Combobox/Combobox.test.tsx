import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox, useComboboxFilter } from './Combobox';

const fruits = ['Apple', 'Banana', 'Mango', 'Melon'];

function TestCombobox({ onOpenChange }: { onOpenChange?: (open: boolean, eventDetails?: unknown) => void }) {
  const { items, getInputProps } = useComboboxFilter(fruits, { filterFn: (item, input) => item.toLowerCase().includes(input.toLowerCase()) });
  return (
    <Combobox.Root onOpenChange={onOpenChange}>
      <Combobox.Input {...getInputProps()} placeholder="Search fruit" />
      <Combobox.Portal>
        <Combobox.Popup>
          <Combobox.Status>{items.length} match{items.length !== 1 ? 'es' : ''}</Combobox.Status>
          {items.length === 0
            ? <Combobox.Empty>No results</Combobox.Empty>
            : items.map((fruit) => <Combobox.Item key={fruit} value={fruit}>{fruit}</Combobox.Item>)
          }
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

  test('Combobox.Status announces result count', async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'm');
    // Status should show the matching count
    const status = document.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
    expect(status?.textContent).toMatch(/match/i);
  });

  test('Combobox.Status is exported in namespace', () => {
    expect(Combobox.Status).toBeDefined();
  });

  test('forwards onOpenChange with eventDetails', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<TestCombobox onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('combobox'));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
