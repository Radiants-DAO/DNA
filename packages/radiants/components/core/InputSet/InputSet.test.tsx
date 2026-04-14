import { render, screen } from '@testing-library/react';
import { InputSet } from './InputSet';

describe('InputSet', () => {
  test('renders <fieldset> element', () => {
    const { container } = render(
      <InputSet.Root>
        <InputSet.Legend>Group</InputSet.Legend>
      </InputSet.Root>
    );
    expect(container.querySelector('fieldset')).toBeInTheDocument();
  });

  test('legend renders', () => {
    render(
      <InputSet.Root>
        <InputSet.Legend>Contact Info</InputSet.Legend>
      </InputSet.Root>
    );
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  test('has data-rdna="input-set"', () => {
    const { container } = render(
      <InputSet.Root>
        <InputSet.Legend>Test</InputSet.Legend>
      </InputSet.Root>
    );
    expect(container.querySelector('[data-rdna="input-set"]')).toBeInTheDocument();
  });

  test('applies the pixel-rounded-xs class to the fieldset shell', () => {
    const { container } = render(
      <InputSet.Root>
        <InputSet.Legend>Styled</InputSet.Legend>
      </InputSet.Root>
    );
    const fieldset = container.querySelector('[data-rdna="input-set"]');
    expect(fieldset).toHaveClass('pixel-rounded-xs');
    expect(fieldset).toHaveClass('bg-transparent');
  });

  test('disabled sets data-disabled on fieldset', () => {
    const { container } = render(
      <InputSet.Root disabled>
        <InputSet.Legend>Disabled</InputSet.Legend>
        <input placeholder="child" />
      </InputSet.Root>
    );
    // Base UI Fieldset uses data-disabled attribute
    const fieldset = container.querySelector('[data-rdna="input-set"]');
    expect(fieldset).toHaveAttribute('data-disabled');
  });
});
