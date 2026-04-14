import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { PixelGrid } from '@rdna/pixel';

const mocks = vi.hoisted(() => ({
  paintGrid: vi.fn(),
  computeFlipOrder: vi.fn(() => [1, 3]),
  animateTransition: vi.fn(
    (
      _from: string,
      _to: string,
      _order: number[],
      _duration: number,
      onFrame: (bits: string) => void,
    ) => {
      onFrame('1111000011110000');
      onFrame('0000111100001111');
      return vi.fn();
    },
  ),
}));

vi.mock('@rdna/pixel', async () => {
  const actual = await vi.importActual<typeof import('@rdna/pixel')>('@rdna/pixel');
  return {
    ...actual,
    paintGrid: mocks.paintGrid,
    computeFlipOrder: mocks.computeFlipOrder,
    animateTransition: mocks.animateTransition,
  };
});

import { PixelTransition } from './PixelTransition';

const from: PixelGrid = {
  name: 'from',
  width: 4,
  height: 4,
  bits: '1111000011110000',
};

const to: PixelGrid = {
  name: 'to',
  width: 4,
  height: 4,
  bits: '0000111100001111',
};

describe('PixelTransition', () => {
  beforeEach(() => {
    mocks.paintGrid.mockClear();
    mocks.computeFlipOrder.mockClear();
    mocks.animateTransition.mockClear();

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => ({
        clearRect: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
      })),
    });
  });

  test('sizes the canvas from the grid dimensions and pixelSize', () => {
    const { container } = render(
      <PixelTransition from={from} to={to} pixelSize={3} autoPlay={false} />,
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
    expect(canvas).toBeInTheDocument();
    expect(canvas?.width).toBe(12);
    expect(canvas?.height).toBe(12);
    expect(canvas?.style.width).toBe('12px');
    expect(canvas?.style.height).toBe('12px');
  });

  test('starts animation on mount and paints intermediate and final frames', () => {
    render(<PixelTransition from={from} to={to} pixelSize={2} duration={250} />);

    expect(mocks.computeFlipOrder).toHaveBeenCalledWith(from.bits, to.bits, 'random', 4, 4);
    expect(mocks.animateTransition).toHaveBeenCalledTimes(1);
    expect(mocks.paintGrid).toHaveBeenCalledTimes(3);
    expect(mocks.paintGrid.mock.calls[0]?.[1].bits).toBe(from.bits);
    expect(mocks.paintGrid.mock.calls[1]?.[1].bits).toBe('1111000011110000');
    expect(mocks.paintGrid.mock.calls[2]?.[1].bits).toBe('0000111100001111');
  });

  test('clears the canvas before each painted frame', () => {
    const clearRect = vi.fn();

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => ({
        clearRect,
        fillStyle: '',
        fillRect: vi.fn(),
      })),
    });

    render(<PixelTransition from={from} to={to} pixelSize={2} duration={250} />);

    expect(clearRect).toHaveBeenCalledTimes(3);
    expect(clearRect).toHaveBeenNthCalledWith(1, 0, 0, 8, 8);
    expect(clearRect).toHaveBeenNthCalledWith(2, 0, 0, 8, 8);
    expect(clearRect).toHaveBeenNthCalledWith(3, 0, 0, 8, 8);
  });

  test('cancels the active animation on unmount', () => {
    const cancel = vi.fn();
    mocks.animateTransition.mockReturnValueOnce(cancel);

    const { unmount } = render(<PixelTransition from={from} to={to} autoPlay />);

    unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  test('throws when from/to grid dimensions do not match', () => {
    expect(() =>
      render(
        <PixelTransition
          from={from}
          to={{
            ...to,
            width: 2,
            height: 8,
          }}
        />,
      ),
    ).toThrow('PixelTransition requires matching grid dimensions');
  });
});
