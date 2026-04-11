import { render, screen } from '@testing-library/react';
import { NumberField } from './NumberField';

// Base UI NumberField renders input as role="textbox" with inputMode="numeric"

function TestNumberField(props: Parameters<typeof NumberField.Root>[0]) {
  return (
    <NumberField.Root {...props}>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  );
}

describe('NumberField', () => {
  test('renders with numeric input', () => {
    const { container } = render(<TestNumberField defaultValue={5} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(container.querySelector('.pixel-rounded-xs')).toBeInTheDocument();
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
  });

  test('forwards readOnly to the input', () => {
    render(<TestNumberField readOnly defaultValue={10} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  test('forwards name for form submission', () => {
    render(<TestNumberField name="quantity" defaultValue={1} />);
    // Base UI creates a hidden input for form submission
    const hiddenInput = document.querySelector('input[name="quantity"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  test('forwards required prop', () => {
    render(<TestNumberField required defaultValue={1} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
});
