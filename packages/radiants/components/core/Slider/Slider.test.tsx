import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './Slider';
import * as SliderModule from './Slider';

// Base UI Slider positions its thumb asynchronously — use findByRole throughout.

async function getSlider() {
  return screen.findByRole('slider');
}

async function focusAndPress(key: string) {
  const user = userEvent.setup();
  const slider = await getSlider();
  await act(async () => {
    slider.focus();
    await user.keyboard(key);
  });
  return slider;
}

describe('Slider', () => {
  test('renders with slider role', async () => {
    const { container } = render(<Slider value={50} onChange={() => {}} min={0} max={100} />);
    expect(await getSlider()).toBeInTheDocument();
    expect(container.querySelector('[data-slot="slider-track"]')?.className).toContain('rounded-xs');
    expect(container.querySelector('[data-slot="slider-thumb"]')?.className).toContain('rounded-xs');
  });

  test('renders with label and value display', async () => {
    render(<Slider value={75} onChange={() => {}} label="Volume" showValue />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(await getSlider()).toBeInTheDocument();
  });

  test('ArrowRight increases value by step', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} step={5} />);
    await focusAndPress('{ArrowRight}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(55));
  });

  test('keyboard interaction does not emit act warnings', async () => {
    const onChange = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Slider value={50} onChange={onChange} step={5} />);
    await focusAndPress('{ArrowRight}');
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
    await focusAndPress('{ArrowLeft}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(45));
  });

  test('Home key sets value to min', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={10} max={100} />);
    await focusAndPress('{Home}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(10));
  });

  test('End key sets value to max', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} min={0} max={100} />);
    await focusAndPress('{End}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(100));
  });

  test('disabled slider is not focusable', async () => {
    render(<Slider value={50} onChange={() => {}} disabled />);
    const slider = await getSlider();
    expect(slider).toBeDisabled();
  });

  test('Slider.Value is exported', () => {
    const SliderWithValue = SliderModule.Slider as typeof Slider & { Value: unknown };
    expect(SliderWithValue.Value).toBeDefined();
  });

  test('forwards name to slider for form submission', async () => {
    render(<Slider value={50} onChange={() => {}} name="volume" />);
    await getSlider(); // wait for async render
    const hiddenInput = document.querySelector('input[name="volume"]');
    expect(hiddenInput).toBeInTheDocument();
  });
});
