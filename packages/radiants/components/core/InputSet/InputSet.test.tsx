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

  test('wraps the fieldset shell in a PixelBorder (xs radius)', () => {
    const { container } = render(
      <InputSet.Root>
        <InputSet.Legend>Styled</InputSet.Legend>
      </InputSet.Root>
    );
    const fieldset = container.querySelector('[data-rdna="input-set"]');
    const classTokens = fieldset?.className.split(/\s+/) ?? [];

    expect(classTokens).not.toContain('pixel-rounded-xs');
    expect(classTokens).not.toContain('rounded-xs');

    // PixelBorder xs renders 4 corner SVGs with viewBox="0 0 4 4".
    expect(container.querySelectorAll('svg[viewBox="0 0 4 4"]')).toHaveLength(4);
    // Legacy PixelCorner overlay (2×2 viewBox) must not be present.
    expect(container.querySelector('svg[viewBox="0 0 2 2"]')).not.toBeInTheDocument();
    // Single-mode clipper: the fieldset sits inside an overflow-hidden div
    // whose `bg-transparent` background prop is concatenated onto it and
    // whose polygon clip-path matches the staircase exactly. The focus ring
    // is now rendered as a wrapper-level SVG overlay, so the fieldset can
    // safely live inside the clip without losing its focus indication.
    const clipper = fieldset?.closest('.overflow-hidden') as HTMLElement | null;
    expect(clipper).not.toBeNull();
    expect(clipper).toHaveClass('bg-transparent');
    expect(clipper?.style.clipPath).toContain('polygon(');
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
