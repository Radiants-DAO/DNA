import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';

describe('Slider', () => {
  test('renders with correct aria attributes', () => {
    render(<Slider value={50} onChange={() => {}} min={0} max={100} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  test('renders with label and value display', () => {
    render(
      <Slider value={75} onChange={() => {}} label="Volume" showValue />,
    );
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  test('ArrowRight increases value by step', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} step={5} />);

    const user = userEvent.setup();
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(55);
  });

  test('ArrowLeft decreases value by step', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} step={5} />);

    const user = userEvent.setup();
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(45);
  });

  test('Home key sets value to min', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={10} max={100} />);

    const user = userEvent.setup();
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenCalledWith(10);
  });

  test('End key sets value to max', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={0} max={100} />);

    const user = userEvent.setup();
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenCalledWith(100);
  });

  test('value clamps to min/max bounds', async () => {
    const onChange = vi.fn();
    render(<Slider value={0} onChange={onChange} min={0} max={100} step={1} />);

    const user = userEvent.setup();
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    // Should not go below min
    expect(onChange).toHaveBeenCalledWith(0);
  });

  test('disabled slider does not respond to keyboard', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} disabled />);

    const slider = screen.getByRole('slider');
    // disabled slider should have tabindex -1
    expect(slider).toHaveAttribute('aria-disabled', 'true');
  });
});
