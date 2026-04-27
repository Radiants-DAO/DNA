import type { LayerProps, PixelModifyItem } from '@/lib/dotting';

/**
 * Convert a dotting layer's pixel data into a size*size bitstring.
 * Cells are placed by their logical (rowIndex, columnIndex), which ranges
 * from -floor(size/2) to +ceil(size/2)-1. A cell is '1' iff its color
 * equals `fgColor`; missing cells are '0'.
 *
 * Sparse-safe: accepts both the dense init shape (`LayerProps`) and the
 * possibly-sparse reactive shape from `useData` (`Array<Array<PixelModifyItem>>`).
 */
export function bitsFromLayer(
  layer: { data: Array<Array<Pick<PixelModifyItem, 'rowIndex' | 'columnIndex' | 'color'>>> } | Pick<LayerProps, 'data'>,
  size: number,
  fgColor: string,
): string {
  const origin = -Math.floor(size / 2);
  const chars = new Array<string>(size * size).fill('0');
  for (const row of layer.data) {
    for (const cell of row) {
      if (!cell) continue;
      const r = cell.rowIndex - origin;
      const c = cell.columnIndex - origin;
      if (r < 0 || r >= size || c < 0 || c >= size) continue;
      if (cell.color === fgColor) chars[r * size + c] = '1';
    }
  }
  return chars.join('');
}
