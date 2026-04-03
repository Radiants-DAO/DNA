import { describe, expect, it, vi } from 'vitest';

import { animateTransition, computeFlipOrder, interpolateFrame } from '../transition';

describe('computeFlipOrder', () => {
  it('returns diff indices in random order for random mode', () => {
    const order = computeFlipOrder('11001100', '00110011', 'random', 4, 2);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns center-nearest indices first for radial mode', () => {
    const order = computeFlipOrder('10000001', '01111110', 'radial', 8, 1);
    expect([3, 4]).toContain(order[0]);
    expect([0, 7]).toContain(order[order.length - 1]);
  });

  it('returns diff indices in scanline order for scanline mode', () => {
    expect(computeFlipOrder('1111', '0000', 'scanline', 2, 2)).toEqual([
      0,
      1,
      2,
      3,
    ]);
  });

  it('returns empty array when frames are identical', () => {
    expect(computeFlipOrder('1010', '1010', 'random', 2, 2)).toEqual([]);
  });

  it('spreads flips for scatter mode', () => {
    expect(computeFlipOrder('11111111', '00000000', 'scatter', 4, 2)).toEqual([
      0,
      2,
      4,
      6,
      1,
      3,
      5,
      7,
    ]);
  });
});

describe('interpolateFrame', () => {
  it('returns from-grid at progress 0', () => {
    expect(
      interpolateFrame('11110000', '00001111', [0, 1, 2, 3, 4, 5, 6, 7], 0),
    ).toBe('11110000');
  });

  it('returns to-grid at progress 1', () => {
    expect(
      interpolateFrame('11110000', '00001111', [0, 1, 2, 3, 4, 5, 6, 7], 1),
    ).toBe('00001111');
  });

  it('flips half the bits at progress 0.5', () => {
    expect(
      interpolateFrame('11110000', '00001111', [0, 1, 2, 3, 4, 5, 6, 7], 0.5),
    ).toBe('00000000');
  });
});

describe('animateTransition', () => {
  it('emits intermediate and final frames in RAF order', () => {
    let timestamp = 0;
    const queue: FrameRequestCallback[] = [];
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      queue.push(callback);
      return queue.length;
    });
    const cancelAnimationFrame = vi.fn();
    const onFrame = vi.fn();

    const previousRaf = globalThis.requestAnimationFrame;
    const previousCancel = globalThis.cancelAnimationFrame;

    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      value: cancelAnimationFrame,
    });

    try {
      const cancel = animateTransition(
        '11110000',
        '00001111',
        [0, 1, 2, 3, 4, 5, 6, 7],
        100,
        onFrame,
      );

      while (queue.length > 0) {
        const callback = queue.shift();
        if (!callback) {
          break;
        }

        callback(timestamp);
        timestamp += 50;
      }

      expect(onFrame).toHaveBeenNthCalledWith(1, '11110000');
      expect(onFrame).toHaveBeenNthCalledWith(2, '00000000');
      expect(onFrame).toHaveBeenNthCalledWith(3, '00001111');

      cancel();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'requestAnimationFrame', {
        configurable: true,
        value: previousRaf,
      });
      Object.defineProperty(globalThis, 'cancelAnimationFrame', {
        configurable: true,
        value: previousCancel,
      });
    }
  });
});
