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
  | 'notch'
  | 'scallop'
  | 'crenellation'
  | 'sawtooth'
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
// notch — stepped rectangular cutout
//
// Removes a rectangular notch from the TL corner. The notch is a square
// of size floor(N/2) × floor(N/2). The border traces the inside edge
// of the notch (bottom edge + right edge of the cutout).
//
// Example (N=8, notch=4):
//   CCCCBBBB    C=cover, B=border, .=interior
//   CCCCB...
//   CCCCB...
//   CCCCB...
//   BBBB....
//   ........
//   ........
//   ........
// ---------------------------------------------------------------------------

function generateNotch(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'notch');
  const N = gridSize;
  const notchSize = Math.floor(N / 2);
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  // Cover: the notch rectangle (rows 0..notchSize-1, cols 0..notchSize-1)
  for (let row = 0; row < notchSize; row++) {
    for (let col = 0; col < notchSize; col++) {
      coverBits[row * N + col] = '1';
    }
  }

  // Border: right edge of the notch (rows 0..notchSize-1 at col notchSize)
  // But the top-right corner pixel of the notch is shared, so start from row 0.
  for (let row = 0; row < notchSize; row++) {
    borderBits[row * N + notchSize] = '1';
  }

  // Border: bottom edge of the notch (row notchSize, cols 0..notchSize)
  for (let col = 0; col <= notchSize; col++) {
    borderBits[notchSize * N + col] = '1';
  }

  // The corner pixel at (notchSize, notchSize) is already set by the bottom edge.
  // Remove it from border — the intersection pixel is drawn once.
  // Actually, it's fine — both loops set it to '1', and that's correct.
  // But we need to make sure cover and border don't overlap:
  // Cover is rows 0..notchSize-1, cols 0..notchSize-1.
  // Border right edge is rows 0..notchSize-1 at col=notchSize — no overlap.
  // Border bottom edge is row=notchSize, cols 0..notchSize — no overlap.

  // Also add the top border row (row 0, cols notchSize..N-1)
  for (let col = notchSize; col < N; col++) {
    borderBits[0 * N + col] = '1';
  }

  // And the left border column (rows notchSize..N-1, col 0)
  for (let row = notchSize; row < N; row++) {
    borderBits[row * N + 0] = '1';
  }

  return makeGrids('notch', N, coverBits, borderBits);
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
// sawtooth — zigzag teeth along the diagonal
//
// Creates a sawtooth pattern: right-angled triangular teeth along the
// diagonal from TL to BR. Each tooth is a right triangle with legs
// of size `toothSize`.
//
// For a TL corner, the sawtooth creates a stepped diagonal where each
// step is a small right triangle (chamfer + step back).
// ---------------------------------------------------------------------------

function generateSawtooth(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'sawtooth');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  // Tooth size: how many pixels each sawtooth tooth spans
  const toothSize = Math.max(2, Math.floor(N / 3));

  // For each row, determine the rightmost cover column.
  // The sawtooth creates a pattern where the edge zigzags:
  // within each tooth of height `toothSize`, the edge goes from
  // (startCol) to (startCol - toothSize) diagonally, then jumps
  // back to (startCol - toothSize) for the next tooth.
  for (let row = 0; row < N; row++) {
    // Which tooth are we in?
    const toothIndex = Math.floor(row / toothSize);
    const rowInTooth = row % toothSize;

    // Each tooth starts at column: N - 1 - (toothIndex * toothSize)
    // and the diagonal goes left by rowInTooth
    const edgeCol = N - 1 - (toothIndex * toothSize) - rowInTooth;

    if (edgeCol < 0) {
      // Past the last tooth — no cover on this row
      continue;
    }

    // Cover: everything to the left of the edge
    for (let col = 0; col < edgeCol; col++) {
      coverBits[row * N + col] = '1';
    }

    // Border: the edge pixel
    if (edgeCol < N) {
      borderBits[row * N + edgeCol] = '1';
    }
  }

  return makeGrids('sawtooth', N, coverBits, borderBits);
}

// ---------------------------------------------------------------------------
// octagon — equal horizontal, vertical, and diagonal cuts
//
// An octagonal corner removes a triangle from the TL corner, but with
// equal-length horizontal and vertical runs connected by a 45° diagonal.
//
// The cut has 3 segments:
//   1. Horizontal run along the top (length h)
//   2. Diagonal at 45° (length d pixels)
//   3. Vertical run down the left (length h)
//
// Where h = floor(N/3) and d = N - 2*h.
//
// Example (N=9, h=3, d=3):
//   CCCCCCCBB   row 0: 7 cover, border at col 7-8 (horiz run end)
//   CCCCCCCB.   row 1: 7 cover, border at col 7
//   CCCCCCCB.   row 2: 7 cover, border at col 7
//   CCCCCCB..   row 3: 6 cover, border at col 6 (diagonal)
//   CCCCCB...   row 4: 5 cover, border at col 5 (diagonal)
//   CCCCB....   row 5: 4 cover, border at col 4 (diagonal)
//   BBB......   row 6: border at cols 0-2 (vert run start)
//   .B.......   row 7: border at col 1
//   .B.......   row 8: border at col 1
//
// Wait, that's not right. Let me think about this as a TL corner octagon.
// For the TL corner, we clip a shape that creates an octagonal profile.
//
// The border traces: vertical run down from (0, h) to (0, N-1),
// then a diagonal from (0, h) up-right to (h, 0),
// then a horizontal run from (h, 0) to (N-1, 0).
//
// Actually, simpler: the cut shape for the TL corner of an octagon is
// a triangle with a flattened hypotenuse:
//   - Top-left portion is cover
//   - The edge goes: horizontal segment at top, diagonal, vertical segment at left
// ---------------------------------------------------------------------------

function generateOctagon(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'octagon');
  const N = gridSize;
  const coverBits = new Array(N * N).fill('0');
  const borderBits = new Array(N * N).fill('0');

  // The flat segments at the top and left, plus diagonal between them.
  const flatLen = Math.max(1, Math.floor(N / 3));
  const diagLen = N - 2 * flatLen;

  // Build the edge profile: for each row, where is the border column?
  // Row 0..flatLen-1: horizontal flat at top. Border col = N - 1 - row
  //   No wait — for an octagon TL corner, it's like a chamfer but with
  //   flat segments at both ends of the diagonal.
  //
  // The profile from top-right to bottom-left:
  //   Rows 0..(flatLen-1):    border at col (N - flatLen)  [horizontal segment]
  //   Rows flatLen..(flatLen+diagLen-1): border at col (N - flatLen - 1 - (row - flatLen))  [diagonal]
  //   Rows (flatLen+diagLen)..(N-1): border at col 0  [vertical segment]

  for (let row = 0; row < N; row++) {
    let borderCol: number;

    if (row < flatLen) {
      // Horizontal flat segment at top
      borderCol = N - flatLen;
    } else if (row < flatLen + diagLen) {
      // Diagonal segment
      const diagProgress = row - flatLen;
      borderCol = N - flatLen - 1 - diagProgress;
    } else {
      // Vertical flat segment at left
      borderCol = 0;
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
  notch: generateNotch,
  scallop: generateScallop,
  crenellation: generateCrenellation,
  sawtooth: generateSawtooth,
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
