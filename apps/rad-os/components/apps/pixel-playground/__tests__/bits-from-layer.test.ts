import { describe, expect, it } from 'vitest';
import { bitsFromLayer } from '../bits-from-layer';
import type { LayerProps } from '@/lib/dotting';

const FG = '#111';
const BG = '#fff';

function makeLayer(size: number, on: Array<[number, number]>): LayerProps {
  const origin = -Math.floor(size / 2);
  const set = new Set(on.map(([r, c]) => `${r}:${c}`));
  const data = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: set.has(`${r}:${c}`) ? FG : BG,
      });
    }
    data.push(row);
  }
  return { id: 'default', data };
}

describe('bitsFromLayer', () => {
  it('emits 1s for FG pixels and 0s for BG', () => {
    const layer = makeLayer(3, [[0, 0], [1, 1], [2, 2]]);
    const bits = bitsFromLayer(layer, 3, FG);
    expect(bits).toBe('100010001');
  });

  it('treats anything not matching FG as 0', () => {
    const layer = makeLayer(2, []);
    const bits = bitsFromLayer(layer, 2, FG);
    expect(bits).toBe('0000');
  });
});
