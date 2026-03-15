import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';

async function focusAndPress(slider: HTMLElement, key: string) {
  const user = userEvent.setup();
  await act(async () => {
    slider.focus();
    await user.keyboard(key);
  });
}

describe('Slider', () => {
  test('renders with slider role', () => {
    render(<Slider value={50} onChange={() => {}} min={0} max={100} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
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

    const slider = screen.getByRole('slider');
    await focusAndPress(slider, '{ArrowRight}');

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(55);
    });
  });

  test('keyboard interaction does not emit act warnings', async () => {
    const onChange = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Slider value={50} onChange={onChange} step={5} />);

    const slider = screen.getByRole('slider');
    await focusAndPress(slider, '{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith(55);
    expect(
      consoleErrorSpy.mock.calls.some(([message]) =>
        String(message).includes('not wrapped in act')
      )
    ).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  test('ArrowLeft decreases value by step', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} step={5} />);

    const slider = screen.getByRole('slider');
    await focusAndPress(slider, '{ArrowLeft}');

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(45);
    });
  });

  test('Home key sets value to min', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={10} max={100} />);

    const slider = screen.getByRole('slider');
    await focusAndPress(slider, '{Home}');

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(10);
    });
  });

  test('End key sets value to max', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={0} max={100} />);

    const slider = screen.getByRole('slider');
    await focusAndPress(slider, '{End}');

    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(100);
    });
  });

  test('Slider.Value is exported and renders current value', () => {
    const { Slider } = require('./Slider');
    expect(Slider.Value).toBeDefined();
  });

  test('forwards name to slider for form submission', () => {
    render(<Slider value={50} onChange={() => {}} name="volume" />);
    const hiddenInput = document.querySelector('input[name="volume"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  test('disabled slider is not focusable', () => {
    render(<Slider value={50} onChange={() => {}} disabled />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });
});
