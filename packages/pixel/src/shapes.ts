import type { PixelCornerSet, PixelGrid } from './types.js';
import { generateCorner } from './generate.js';

// ---------------------------------------------------------------------------
// Shape generator type
// ---------------------------------------------------------------------------

/**
 * A corner shape generator function.
 *
 * Takes a grid size N and returns a PixelCornerSet with:
 *   - `tl`: N×N PixelGrid of cover bits (pixels OUTSIDE the shape, to clip away)
 *   - `border`: N×N PixelGrid of border bits (the visible edge pixels)
 *
 * The contract:
 *   cover ∪ border ∪ interior = full N×N grid, no overlap.
 *   `cover[i] === '1' && border[i] === '1'` is never true.
 *
 * Only the TL corner is generated. The other 3 corners are derived via
 * SVG transform mirroring in the CSS generator.
 */
export type CornerShapeGenerator = (gridSize: number) => PixelCornerSet;

/** Shape name — the discriminant used in config and CSS class names. */
export type CornerShapeName =
  | 'circle'
  | 'chamfer'
  | 'scallop'
  | 'crenellation'
  | 'octagon';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGrids(
  shapeName: string,
  N: number,
  coverBits: string[],
  borderBits: string[],
): PixelCornerSet {
  return {
    name: `${shapeName}-${N}`,
    tl: {
      name: `corner-${shapeName}-${N}-cover`,
      width: N,
      height: N,
      bits: coverBits.join(''),
    },
    border: {
      name: `corner-${shapeName}-${N}-border`,
      width: N,
      height: N,
      bits: borderBits.join(''),
    },
  };
}

function assertValidGridSize(gridSize: number, shapeName: string): void {
  if (!Number.isInteger(gridSize) || gridSize < 2) {
    throw new Error(`${shapeName}: gridSize must be an integer >= 2, got ${gridSize}`);
  }
}

// ---------------------------------------------------------------------------
// circle — delegates to the existing Bresenham generator
// ---------------------------------------------------------------------------

function generateCircle(gridSize: number): PixelCornerSet {
  const radius = gridSize - 1;
  return generateCorner(radius);
}

// ---------------------------------------------------------------------------
// chamfer — 45° diagonal cut
//
// For grid size N, the cut removes a triangle from the TL corner:
//   Row 0: columns 0..(N-1) are cover, column (N-1) is border
//   Row 1: columns 0..(N-2) are cover, column (N-2) is border
//   ...
//   Row (N-2): column 0 is cover, column 0 is actually border
//   Row (N-1): column 0 is border (the final pixel)
//
// Actually simpler: the border is a perfect diagonal staircase.
// At row r, border is at column (N - 1 - r). Cover is everything left of that.
// ---------------------------------------------------------------------------

function generateChamfer(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'chamfer');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  for (let row = 0; row < N; row++) {
    const borderCol = N - 1 - row;

    // Cover: everything to the left of the border pixel
    for (let col = 0; col < borderCol; col++) {
      coverBits[row * N + col] = '1';
    }

    // Border: the diagonal pixel
    borderBits[row * N + borderCol] = '1';
  }

  return makeGrids('chamfer', N, coverBits, borderBits);
}

// ---------------------------------------------------------------------------
// scallop — semicircular bite out of the corner
//
// A filled quarter-circle of radius N centered at (N-1, N-1) — the opposite
// corner from TL. Everything INSIDE that circle is interior (visible).
// Everything outside is cover. The arc boundary pixels are border.
//
// This creates a concave scallop effect — the corner is scooped out
// in a smooth curve, the inverse of the circle shape.
// ---------------------------------------------------------------------------

function generateScallop(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'scallop');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  // Center of the scallop arc is at the bottom-right of the grid (N-1, N-1).
  // We test each pixel's distance from that center.
  const cx = N - 1;
  const cy = N - 1;
  const R = N - 1; // radius

  // For each row, find the boundary using distance
  for (let row = 0; row < N; row++) {
    let borderCol = -1;

    for (let col = 0; col < N; col++) {
      const dx = cx - col;
      const dy = cy - row;
      const dist2 = dx * dx + dy * dy;

      if (dist2 > R * R) {
        // Outside the circle — this is cover
        coverBits[row * N + col] = '1';
      } else {
        // First pixel inside the circle on this row = border
        if (borderCol === -1) {
          borderCol = col;
        }
      }
    }

    // Set border pixel: the first interior pixel on each row
    if (borderCol >= 0) {
      borderBits[row * N + borderCol] = '1';
      // If the cover extends up to borderCol-1, then borderCol is correct.
      // But we also need the bottom edge: for the last row that has any cover pixels,
      // the border should trace vertically too.
    }
  }

  // Also trace the vertical border: for each column, find the first interior pixel
  for (let col = 0; col < N; col++) {
    for (let row = 0; row < N; row++) {
      const dx = cx - col;
      const dy = cy - row;
      const dist2 = dx * dx + dy * dy;

      if (dist2 <= R * R) {
        // First interior pixel in this column
        borderBits[row * N + col] = '1';
        break;
      }
    }
  }

  // Clean up: ensure border and cover don't overlap
  for (let i = 0; i < N * N; i++) {
    if (coverBits[i] === '1' && borderBits[i] === '1') {
      borderBits[i] = '0';
    }
  }

  return makeGrids('scallop', N, coverBits, borderBits);
}

// ---------------------------------------------------------------------------
// crenellation — alternating teeth (battlements pattern)
//
// The top portion of the grid alternates between solid teeth and gaps.
// Tooth width = max(1, floor(N/4)). Tooth height = floor(N/2).
// Gaps are cover, teeth are interior, edges are border.
//
// Example (N=8, tooth=2, height=4):
//   CC..CC..    C=cover, .=interior, B=border (edges)
//   CC..CC..
//   CC..CC..
//   CC..CC..
//   ........
//   ........
//
// With border:
//   CCB.CCB.
//   CCB.CCB.
//   CCB.CCB.
//   BBBBBBB.
//   B.......
//   B.......
// ---------------------------------------------------------------------------

function generateCrenellation(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'crenellation');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  const toothWidth = Math.max(1, Math.floor(N / 4));
  const toothHeight = Math.floor(N / 2);

  // Mark cover regions: alternating gaps in the top portion
  // Pattern: starting from col 0, first `toothWidth` cols are gap (cover),
  // next `toothWidth` cols are tooth (interior), repeat.
  for (let row = 0; row < toothHeight; row++) {
    for (let col = 0; col < N; col++) {
      const segment = Math.floor(col / toothWidth);
      const isGap = segment % 2 === 0; // even segments are gaps
      if (isGap) {
        coverBits[row * N + col] = '1';
      }
    }
  }

  // Border: trace edges between cover and interior
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const idx = row * N + col;
      if (coverBits[idx] === '1') continue; // cover pixels are never border

      // Check if this interior pixel is adjacent to a cover pixel
      const neighbors = [
        row > 0 ? (row - 1) * N + col : -1,       // above
        row < N - 1 ? (row + 1) * N + col : -1,   // below
        col > 0 ? row * N + (col - 1) : -1,       // left
        col < N - 1 ? row * N + (col + 1) : -1,   // right
      ];

      // Also treat out-of-bounds (top/left edges) as "cover" for border detection
      const adjacentToCover =
        row === 0 || col === 0 ||
        neighbors.some((n) => n >= 0 && coverBits[n] === '1');

      if (adjacentToCover) {
        borderBits[idx] = '1';
      }
    }
  }

  return makeGrids('crenellation', N, coverBits, borderBits);
}

// ---------------------------------------------------------------------------
// octagon — horizontal flat, 45° diagonal, vertical flat
//
// The TL corner of an octagon clips a triangle whose hypotenuse has
// three segments: a horizontal run along the top edge, a 45° diagonal,
// and a vertical run down the left edge.
//
// Segment lengths: flatLen = max(1, floor(N/3)), diagLen = N - 2*flatLen.
//
// The border column per row steps like this:
//   Rows 0..(flatLen-1):            col = N - flatLen  (vertical edge for horiz flat)
//   Rows flatLen..(flatLen+diagLen-1): col steps left by 1 per row (diagonal)
//   Rows (flatLen+diagLen)..(N-1):  col = flatLen - 1 - (row - flatLen - diagLen)
//                                   stepping down to col 0 (horiz edge for vert flat)
//
// The last segment previously jumped to col=0, leaving a gap between
// the diagonal's endpoint and the vertical flat. Fix: the vertical flat
// border steps down 1 column per row from the diagonal's last column.
// ---------------------------------------------------------------------------

function generateOctagon(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'octagon');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  const flatLen = Math.max(1, Math.floor(N / 3));
  const diagLen = N - 2 * flatLen;

  // The diagonal ends at this column:
  const diagEndCol = N - flatLen - diagLen;
  // = N - flatLen - (N - 2*flatLen) = flatLen

  for (let row = 0; row < N; row++) {
    let borderCol: number;

    if (row < flatLen) {
      // Horizontal flat: border is a vertical edge at constant column
      borderCol = N - flatLen;
    } else if (row < flatLen + diagLen) {
      // Diagonal: steps left by 1 per row
      const diagProgress = row - flatLen;
      borderCol = N - flatLen - 1 - diagProgress;
    } else {
      // Vertical flat: border is a horizontal edge at constant column
      // The diagonal ended at col = diagEndCol = flatLen.
      // The vertical flat continues from there, holding at the same column.
      borderCol = diagEndCol;
    }

    // Cover: everything to the left of border
    for (let col = 0; col < borderCol; col++) {
      coverBits[row * N + col] = '1';
    }

    // Border pixel
    borderBits[row * N + borderCol] = '1';
  }

  return makeGrids('octagon', N, coverBits, borderBits);
}

// ---------------------------------------------------------------------------
// Shape registry
// ---------------------------------------------------------------------------

export const SHAPE_REGISTRY: Record<CornerShapeName, CornerShapeGenerator> = {
  circle: generateCircle,
  chamfer: generateChamfer,
  scallop: generateScallop,
  crenellation: generateCrenellation,
  octagon: generateOctagon,
};

/**
 * Generate a corner set for the given shape and grid size.
 *
 * @param shape - Shape name from the registry.
 * @param gridSize - N×N grid dimension. Must be >= 2.
 * @returns PixelCornerSet with cover (`tl`) and `border` grids.
 */
export function generateShape(
  shape: CornerShapeName,
  gridSize: number,
): PixelCornerSet {
  const generator = SHAPE_REGISTRY[shape];
  if (!generator) {
    throw new Error(
      `Unknown corner shape "${shape}". Available: ${Object.keys(SHAPE_REGISTRY).join(', ')}`,
    );
  }
  return generator(gridSize);
}

/**
 * Register a custom shape generator.
 * Allows extending the registry with user-defined shapes.
 */
export function registerShape(
  name: string,
  generator: CornerShapeGenerator,
): void {
  (SHAPE_REGISTRY as Record<string, CornerShapeGenerator>)[name] = generator;
}

/** List all registered shape names. */
export function listShapes(): string[] {
  return Object.keys(SHAPE_REGISTRY);
}
