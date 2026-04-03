import { describe, expect, it, vi } from 'vitest';

import { bitsToGrid } from '../core';
import { createGridCanvas, paintGrid, paintTiledGrid } from '../renderer';

function mockCanvas(width: number, height: number) {
  const fills: Array<{ x: number; y: number; w: number; h: number }> = [];
  const ctx = {
    fillStyle: '',
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      fills.push({ x, y, w, h });
    }),
    clearRect: vi.fn(),
    canvas: { width, height },
  };

  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
}

describe('paintGrid', () => {
  it('calls fillRect for each set bit', () => {
    const grid = bitsToGrid('test', 2, 2, '1010');
    const { ctx, fills } = mockCanvas(2, 2);

    paintGrid(ctx, grid, '#000', 1);

    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    expect(fills[0]).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(fills[1]).toEqual({ x: 0, y: 1, w: 1, h: 1 });
  });

  it('scales pixels by pixelSize', () => {
    const grid = bitsToGrid('test', 2, 2, '1000');
    const { ctx, fills } = mockCanvas(8, 8);

    paintGrid(ctx, grid, '#f00', 4);

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(fills[0]).toEqual({ x: 0, y: 0, w: 4, h: 4 });
  });

  it('sets fillStyle to provided color', () => {
    const grid = bitsToGrid('test', 1, 1, '1');
    const { ctx } = mockCanvas(1, 1);

    paintGrid(ctx, grid, 'oklch(0.9 0.1 90)', 1);

    expect(ctx.fillStyle).toBe('oklch(0.9 0.1 90)');
  });
});

describe('paintTiledGrid', () => {
  it('tiles the grid to fill the canvas', () => {
    const grid = bitsToGrid('dot', 2, 2, '1000');
    const { ctx } = mockCanvas(4, 4);

    paintTiledGrid(ctx, grid, '#000', 1, 4, 4);

    expect(ctx.fillRect).toHaveBeenCalledTimes(4);
  });

  it('throws when pixelSize is not positive', () => {
    const grid = bitsToGrid('dot', 2, 2, '1000');
    const { ctx } = mockCanvas(4, 4);

    expect(() => paintTiledGrid(ctx, grid, '#000', 0, 4, 4)).toThrow(
      'pixelSize must be greater than 0',
    );
  });
});

describe('createGridCanvas', () => {
  it('creates a canvas sized to the rendered grid', () => {
    const grid = bitsToGrid('dot', 2, 3, '100001');
    const fillRect = vi.fn();
    const getContext = vi.fn(() => ({ fillStyle: '', fillRect }));
    const createElement = vi.fn(() => ({
      width: 0,
      height: 0,
      getContext,
    }));

    const previousDocument = globalThis.document;
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { createElement },
    });

    try {
      const canvas = createGridCanvas(grid, '#111', 2);
      expect(createElement).toHaveBeenCalledWith('canvas');
      expect(canvas.width).toBe(4);
      expect(canvas.height).toBe(6);
      expect(getContext).toHaveBeenCalledWith('2d');
      expect(fillRect).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: previousDocument,
      });
    }
  });
});
