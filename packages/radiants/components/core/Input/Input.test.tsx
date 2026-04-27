import { render, screen } from '@testing-library/react';
import { Input, TextArea } from './Input';

describe('Input', () => {
  // ── Standalone mode ──────────────────────────────────────────────────
  test('standalone renders <input> with pixel-rounded shell', () => {
    const { container } = render(<Input placeholder="Search..." />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('data-rdna', 'input');
    const shell = container.firstElementChild as HTMLElement | null;
    expect(shell).toHaveClass('pixel-rounded-4');
    expect(shell).toHaveClass('bg-page');
  });

  test('size variants apply correct data-size', () => {
    const { rerender } = render(<Input placeholder="sm" size="sm" />);
    expect(screen.getByPlaceholderText('sm')).toHaveAttribute('data-size', 'sm');

    rerender(<Input placeholder="lg" size="lg" />);
    expect(screen.getByPlaceholderText('lg')).toHaveAttribute('data-size', 'lg');
  });

  test('standalone error applies the pixel-border-danger class', () => {
    const { container } = render(<Input placeholder="err" error />);
    const shell = container.firstElementChild as HTMLElement | null;
    expect(shell).toHaveClass('pixel-border-danger');
    expect(screen.getByPlaceholderText('err')).toHaveAttribute('data-rdna', 'input');
  });

  test('standalone renders correctly without Root', () => {
    const { container } = render(<Input placeholder="bare" />);
    // No BaseField.Root wrapper
    expect(container.querySelector('[data-rdna="input-field"]')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('bare')).toBeInTheDocument();
  });

  // ── Compound mode (inside Input.Root) ─────────────────────────────────
  test('inside Root: label auto-associated (no manual htmlFor)', () => {
    render(
      <Input.Root>
        <Input.Label>Email</Input.Label>
        <Input placeholder="you@example.com" />
      </Input.Root>
    );
    // Base UI Field auto-wires label to control via id
    const input = screen.getByPlaceholderText('you@example.com');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  test('inside Root: renders data-rdna="input-field"', () => {
    const { container } = render(
      <Input.Root>
        <Input.Label>Name</Input.Label>
        <Input placeholder="Jane" />
      </Input.Root>
    );
    expect(container.querySelector('[data-rdna="input-field"]')).toBeInTheDocument();
  });

  test('inside Root: description renders', () => {
    render(
      <Input.Root>
        <Input.Label>Email</Input.Label>
        <Input placeholder="test" />
        <Input.Description>We won&apos;t share it.</Input.Description>
      </Input.Root>
    );
    expect(screen.getByText("We won't share it.")).toBeInTheDocument();
  });

  test('inside Root: error renders when invalid set', () => {
    render(
      <Input.Root invalid>
        <Input.Label>Password</Input.Label>
        <Input type="password" placeholder="pwd" />
        <Input.Error match>Password is required.</Input.Error>
      </Input.Root>
    );
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  test('inside Root: error prop on Input is ignored (pixel border stays on default line color)', () => {
    const { container } = render(
      <Input.Root>
        <Input.Label>Test</Input.Label>
        <Input placeholder="test" error />
      </Input.Root>
    );
    const field = container.querySelector('[data-rdna="input-field"]');
    expect(field).toBeInTheDocument();
    expect(field).not.toHaveClass('pixel-border-danger');
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('data-rdna', 'input');
  });

  test('disabled propagation from Root', () => {
    render(
      <Input.Root disabled>
        <Input.Label>Disabled Field</Input.Label>
        <Input placeholder="disabled" />
      </Input.Root>
    );
    const input = screen.getByPlaceholderText('disabled');
    expect(input).toBeDisabled();
  });

  test('Input.Label renders required asterisk', () => {
    render(
      <Input.Root>
        <Input.Label required>Required</Input.Label>
        <Input placeholder="req" />
      </Input.Root>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-danger');
  });
});

describe('TextArea', () => {
  test('standalone renders textarea', () => {
    render(<TextArea placeholder="Write..." />);
    const textarea = screen.getByPlaceholderText('Write...');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  test('inside Root: auto-wires label', () => {
    render(
      <Input.Root>
        <Input.Label>Message</Input.Label>
        <TextArea placeholder="msg" />
      </Input.Root>
    );
    expect(screen.getByPlaceholderText('msg')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
});
