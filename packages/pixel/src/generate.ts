import type { PixelGrid, PixelCornerSet } from './types.js';

/**
 * Generate a pixel corner set using Bresenham's midpoint circle algorithm.
 *
 * Computes a quarter-circle arc for the given radius, then splits it into
 * a cover grid (bg-colored pixels outside the arc) and a border grid
 * (the 1px staircase edge on the arc).
 *
 * The grid size is (radius + 1) × (radius + 1), with the circle center
 * at (radius, radius) — the bottom-right corner of the TL quadrant grid.
 *
 * @param radius - Circle radius in pixels. Must be a positive integer.
 * @returns A PixelCornerSet with cover as `tl` and border as `border`.
 */
export function generateCorner(radius: number): PixelCornerSet {
  if (!Number.isInteger(radius) || radius < 1) {
    throw new Error(`radius must be a positive integer, got ${radius}`);
  }

  const N = radius + 1; // grid size
  const arcPoints = bresenhamQuarterArc(radius);

  // Group arc pixels by row
  const rowBuckets = new Map<number, number[]>();
  for (const [col, row] of arcPoints) {
    if (col < 0 || col >= N || row < 0 || row >= N) continue;
    const bucket = rowBuckets.get(row) ?? [];
    bucket.push(col);
    rowBuckets.set(row, bucket);
  }

  // Sort each row's columns and smooth octant-seam kinks.
  // A kink is when pixel count INCREASES going downward (towards the
  // vertical run). At the octant meeting point, the two octants can
  // produce adjacent pixels on the same row, creating a 2-wide block
  // that breaks the smooth staircase.
  //
  // Fix: enforce monotonically non-increasing pixel count per row.
  // If a row has more pixels than the row above, keep only the
  // leftmost pixel (preserving the staircase flow).
  const sortedRows = [...rowBuckets.entries()]
    .map(([row, cols]) => ({ row, cols: [...new Set(cols)].sort((a, b) => a - b) }))
    .sort((a, b) => a.row - b.row);

  // Enforce clean staircase: pixel count per row must be
  // monotonically non-increasing AND once it reaches 1, it stays at 1.
  // This eliminates octant-seam artifacts where two adjacent pixels
  // appear on the same row at the 45° meeting point.
  let reachedSinglePixel = false;
  let prevCount = Infinity;
  for (const entry of sortedRows) {
    if (reachedSinglePixel && entry.cols.length > 1) {
      entry.cols = [entry.cols[0]];
    } else if (entry.cols.length > prevCount) {
      entry.cols = [entry.cols[0]];
    }
    if (entry.cols.length === 1) {
      reachedSinglePixel = true;
    }
    prevCount = entry.cols.length;
  }

  // Ensure 8-connectivity: when the leftmost border pixel jumps by
  // more than 1 column between adjacent rows, insert bridge pixels.
  // This fixes gaps at the octant seam for larger radii where the
  // smoothing pass strips multi-pixel rows down to 1 pixel.
  for (let i = 1; i < sortedRows.length; i++) {
    const prev = sortedRows[i - 1];
    const curr = sortedRows[i];
    if (prev.row + 1 !== curr.row) continue; // non-adjacent rows

    const prevLeft = prev.cols[0];
    const currLeft = curr.cols[0];
    const gap = prevLeft - currLeft; // positive = staircase moving left (downward)

    if (gap > 1) {
      // Bridge: add one pixel per missing column on the current row
      // e.g., prev=30, curr=27 → add 28,29 to curr
      for (let col = currLeft + 1; col < prevLeft; col++) {
        if (!curr.cols.includes(col)) {
          curr.cols.push(col);
        }
      }
      curr.cols.sort((a, b) => a - b);
    }
  }

  // Build grids
  const coverBits: string[] = new Array(N * N).fill('0');
  const borderBits: string[] = new Array(N * N).fill('0');

  for (let row = 0; row < N; row++) {
    const entry = sortedRows.find((e) => e.row === row);
    if (!entry || entry.cols.length === 0) {
      // No arc pixels in this row — entire row is covered
      for (let col = 0; col < N; col++) {
        coverBits[row * N + col] = '1';
      }
      continue;
    }

    const leftmostArc = entry.cols[0];

    // Cover: everything to the left of the leftmost arc pixel
    for (let col = 0; col < leftmostArc; col++) {
      coverBits[row * N + col] = '1';
    }

    // Border: the arc pixels
    for (const col of entry.cols) {
      borderBits[row * N + col] = '1';
    }
  }

  return {
    name: `r${radius}`,
    tl: {
      name: `corner-r${radius}-cover`,
      width: N,
      height: N,
      bits: coverBits.join(''),
    },
    border: {
      name: `corner-r${radius}-border`,
      width: N,
      height: N,
      bits: borderBits.join(''),
    },
  };
}

/**
 * Bresenham's midpoint circle algorithm — TL quadrant only.
 *
 * Uses the standard formulation with integer arithmetic:
 *   x = r, y = 0, d = 1 - r
 *   while x >= y: plot, y++, update d (and maybe x--)
 *
 * For the TL quadrant of a circle centered at (R, R):
 *   - Each first-octant point (x, y) maps to grid (R-x, R-y) and (R-y, R-x)
 *
 * @returns Array of [col, row] grid coordinates for arc pixels.
 */
function bresenhamQuarterArc(R: number): [number, number][] {
  const points: [number, number][] = [];

  let x = R;
  let y = 0;
  let d = 1 - R;

  while (x >= y) {
    // Map to TL quadrant grid coords
    points.push([R - x, R - y]); // octant 7→3
    points.push([R - y, R - x]); // octant 8→4

    y++;
    if (d <= 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
  }

  return points;
}
