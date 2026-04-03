import { describe, expect, it } from 'vitest';

import { bitsToGrid } from '../core';
import { listFilledRects } from '../svg';

describe('listFilledRects', () => {
  it('lists a rect for each filled bit', () => {
    const grid = bitsToGrid('test', 4, 4, '1000000000100000');

    expect(listFilledRects(grid, 2)).toEqual([
      { x: 0, y: 0, width: 2, height: 2 },
      { x: 4, y: 4, width: 2, height: 2 },
    ]);
  });

  it('returns an empty array for an empty grid', () => {
    const grid = bitsToGrid('empty', 2, 2, '0000');
    expect(listFilledRects(grid)).toEqual([]);
  });
});
