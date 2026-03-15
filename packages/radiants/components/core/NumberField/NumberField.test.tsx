import { render, screen } from '@testing-library/react';
import { NumberField } from './NumberField';

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
  test('renders with increment and decrement buttons', () => {
    render(<TestNumberField defaultValue={5} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  test('forwards readOnly to the input', () => {
    render(<TestNumberField readOnly defaultValue={10} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('readonly');
  });

  test('forwards name for form submission', () => {
    render(<TestNumberField name="quantity" defaultValue={1} />);
    const hiddenInput = document.querySelector('input[name="quantity"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  test('forwards required prop', () => {
    render(<TestNumberField required defaultValue={1} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeRequired();
  });
});
