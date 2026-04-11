import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch, switchTrackVariants } from './Switch';

describe('Switch', () => {
  test('renders with label', () => {
    render(<Switch label="Dark mode" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  test('toggles on click', async () => {
    const onChange = vi.fn();
    render(<Switch label="Toggle" checked={false} onChange={onChange} />);

    const user = userEvent.setup();
    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('toggles by keyboard Space', async () => {
    const onChange = vi.fn();
    render(<Switch label="Keyboard" checked={false} onChange={onChange} />);

    const user = userEvent.setup();
    const switchEl = screen.getByRole('switch');
    switchEl.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('reflects checked state', () => {
    const { rerender } = render(
      <Switch checked={false} onChange={() => {}} />,
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<Switch checked={true} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  test('disabled switch does not toggle on click', async () => {
    const onChange = vi.fn();
    render(<Switch label="Disabled" checked={false} onChange={onChange} disabled />);

    const user = userEvent.setup();
    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('preserves data-variant="switch"', () => {
    render(<Switch checked={false} onChange={() => {}} />);
    const el = document.querySelector('[data-variant="switch"]');
    expect(el).toBeInTheDocument();
    expect(el?.className).toContain('rounded-xs');
    expect(el?.className).not.toContain('pixel-rounded');
  });

  test('renders with different sizes', () => {
    const { rerender } = render(
      <Switch checked={false} onChange={() => {}} size="sm" />,
    );
    expect(document.querySelector('[data-size="sm"]')).toBeInTheDocument();

    rerender(<Switch checked={false} onChange={() => {}} size="lg" />);
    expect(document.querySelector('[data-size="lg"]')).toBeInTheDocument();
  });

  test('track variants keep dynamic fill colors in CSS while using fallback borders', () => {
    const classes = switchTrackVariants({
      checked: true,
    });

    expect(classes).toMatch(/\bborder-line\b/);
    expect(classes).not.toMatch(/\bbg-accent\b/);
    expect(classes).not.toMatch(/\bbg-inv\b/);
  });

  test('forwards name, required, and readOnly to the switch element', () => {
    render(<Switch checked={true} onChange={vi.fn()} name="enabled" required readOnly />);
    const switchEl = screen.getByRole('switch');
    // Base UI Switch renders a hidden input for form submission with the name
    const hiddenInput = document.querySelector('input[name="enabled"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  test('labelPosition left renders label before switch', () => {
    render(
      <Switch label="Left label" checked={false} onChange={() => {}} labelPosition="left" />,
    );
    // The label text should appear in the document
    const labelEl = screen.getByText('Left label');
    const switchEl = screen.getByRole('switch');
    // Label should come before switch in DOM order
    const result = labelEl.compareDocumentPosition(switchEl);
    // DOCUMENT_POSITION_FOLLOWING = 4
    expect(result & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
