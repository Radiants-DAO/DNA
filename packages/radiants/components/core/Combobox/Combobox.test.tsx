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
    // PixelBorder renders four corner SVGs (xs = 4x4 viewBox) around the input.
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
    // Layered mode: bg-page sibling layer with polygon clip-path.
    const bgLayer = container.querySelector('.bg-page') as HTMLElement | null;
    expect(bgLayer).toBeInTheDocument();
    expect(bgLayer?.style.clipPath).toContain('polygon(');
    // Trigger class should not carry legacy pixel-rounded utility.
    const classTokens = screen.getByRole('combobox').className.split(/\s+/);
    expect(classTokens).not.toContain('pixel-rounded-xs');
    // Legacy PixelCorner overlay (2x2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });

  test('Combobox.Status is exported in namespace', () => {
    expect(Combobox.Status).toBeDefined();
  });

  test('shows options on focus', async () => {
    const user = userEvent.setup();
    render(<TestCombobox />);
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    // Legacy overlay must not appear anywhere.
    expect(document.querySelectorAll('svg[viewBox="0 0 2 2"]')).toHaveLength(0);
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
