/**
 * Generate the TL-corner border cells for a pixel-art rounded corner.
 *
 * Algorithm: cell-center rasterization of a circle with radius R centered at
 * (R, R), in an R×R grid. A cell (col, row) is INSIDE the circle when its
 * center `(col + 0.5, row + 0.5)` is strictly inside the circle:
 *
 *   (col + 0.5 - R)² + (row + 0.5 - R)² < R²
 *
 * The border is the union of two sets:
 *   - leftmost INSIDE cell in each row (the horizontal leading edge)
 *   - topmost INSIDE cell in each column (the vertical leading edge)
 *
 * This produces a diagonally-symmetric staircase that matches hand-drawn
 * pixel corners exactly. See `test/fixtures/corner-*.svg` for the spec.
 *
 * @param radius - integer radius in pixels, must be >= 1
 * @returns sorted list of `[col, row]` cells, top-left-first
 */
export function generatePixelCornerBorder(radius: number): Array<[number, number]> {
  if (!Number.isInteger(radius) || radius < 1) {
    throw new Error(`radius must be a positive integer, received ${radius}`);
  }

  const R = radius;
  const r2 = R * R;

  const inside = (col: number, row: number): boolean => {
    const dx = col + 0.5 - R;
    const dy = row + 0.5 - R;
    return dx * dx + dy * dy < r2;
  };

  const cells = new Set<number>();
  const key = (col: number, row: number) => row * R + col;

  for (let row = 0; row < R; row++) {
    for (let col = 0; col < R; col++) {
      if (inside(col, row)) {
        cells.add(key(col, row));
        break;
      }
    }
  }

  for (let col = 0; col < R; col++) {
    for (let row = 0; row < R; row++) {
      if (inside(col, row)) {
        cells.add(key(col, row));
        break;
      }
    }
  }

  return [...cells]
    .map((k) => [k % R, Math.floor(k / R)] as [number, number])
    .sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
}
