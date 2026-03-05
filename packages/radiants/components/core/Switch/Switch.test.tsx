import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

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
  });

  test('renders with different sizes', () => {
    const { rerender } = render(
      <Switch checked={false} onChange={() => {}} size="sm" />,
    );
    expect(document.querySelector('[data-size="sm"]')).toBeInTheDocument();

    rerender(<Switch checked={false} onChange={() => {}} size="lg" />);
    expect(document.querySelector('[data-size="lg"]')).toBeInTheDocument();
  });

  test('labelPosition left renders label before switch', () => {
    render(
      <Switch label="Left label" checked={false} onChange={() => {}} labelPosition="left" />,
    );
    const container = screen.getByRole('switch').closest('.inline-flex');
    const children = container?.children;
    // First child should be the label, not the switch track
    expect(children?.[0]?.textContent).toBe('Left label');
  });
});
