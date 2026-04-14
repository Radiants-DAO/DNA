import { describe, it, expect } from 'vitest';
import {
  SHAPE_REGISTRY,
  generateShape,
  registerShape,
  listShapes,
} from '../shapes.js';
import type { CornerShapeName } from '../shapes.js';
import { validateGrid } from '../core.js';

const ALL_SHAPES: CornerShapeName[] = [
  'circle',
  'chamfer',
  'scallop',
  'crenellation',
  'octagon',
];

const TEST_GRID_SIZES = [2, 4, 6, 8, 12, 16, 20, 24, 32];

describe('shape registry', () => {
  it('has all expected shapes registered', () => {
    for (const name of ALL_SHAPES) {
      expect(SHAPE_REGISTRY[name]).toBeTypeOf('function');
    }
  });

  it('listShapes returns all registered names', () => {
    const names = listShapes();
    for (const name of ALL_SHAPES) {
      expect(names).toContain(name);
    }
  });

  it('generateShape throws for unknown shape', () => {
    expect(() => generateShape('bogus' as CornerShapeName, 8)).toThrow(
      /Unknown corner shape/,
    );
  });

  it('registerShape adds a custom generator', () => {
    const custom = (gridSize: number) =>
      generateShape('chamfer', gridSize);
    registerShape('custom-test', custom);
    expect(listShapes()).toContain('custom-test');
    // Clean up
    delete (SHAPE_REGISTRY as Record<string, unknown>)['custom-test'];
  });
});

describe.each(ALL_SHAPES)('shape "%s"', (shape) => {
  it('throws for gridSize < 2', () => {
    expect(() => generateShape(shape, 1)).toThrow();
    expect(() => generateShape(shape, 0)).toThrow();
    expect(() => generateShape(shape, -1)).toThrow();
  });

  it.each(TEST_GRID_SIZES)(
    'generates valid grids for gridSize=%i',
    (gridSize) => {
      const set = generateShape(shape, gridSize);

      // Grid dimensions match
      expect(set.tl.width).toBe(gridSize);
      expect(set.tl.height).toBe(gridSize);
      expect(set.border).toBeDefined();
      expect(set.border!.width).toBe(gridSize);
      expect(set.border!.height).toBe(gridSize);

      // Bits are valid bitstrings with correct length
      expect(() => validateGrid(set.tl)).not.toThrow();
      expect(() => validateGrid(set.border!)).not.toThrow();
    },
  );

  it.each(TEST_GRID_SIZES)(
    'cover and border never overlap for gridSize=%i',
    (gridSize) => {
      const set = generateShape(shape, gridSize);
      for (let i = 0; i < set.tl.bits.length; i++) {
        if (set.tl.bits[i] === '1' && set.border!.bits[i] === '1') {
          throw new Error(
            `${shape} gridSize=${gridSize}: cover/border overlap at index ${i}`,
          );
        }
      }
    },
  );

  it.each(TEST_GRID_SIZES)(
    'has at least one border pixel for gridSize=%i',
    (gridSize) => {
      const set = generateShape(shape, gridSize);
      const borderCount = set.border!.bits.split('').filter((b) => b === '1').length;
      expect(borderCount).toBeGreaterThan(0);
    },
  );

  it.each(TEST_GRID_SIZES)(
    'bottom-right pixel is never cover for gridSize=%i',
    (gridSize) => {
      // The bottom-right pixel of a TL corner grid should always be interior
      // (it's the innermost point, furthest from the corner being clipped)
      const set = generateShape(shape, gridSize);
      const lastIdx = gridSize * gridSize - 1;
      expect(set.tl.bits[lastIdx]).toBe('0');
    },
  );
});

// ---------------------------------------------------------------------------
// Shape-specific invariants
// ---------------------------------------------------------------------------

describe('circle shape', () => {
  it('matches generateCorner output for R=8', () => {
    const set = generateShape('circle', 9); // gridSize=9 → radius=8
    expect(set.tl.width).toBe(9);
    // Border staircase: 3-2-1-1-1-1-1-1-1
    const borderRows: number[] = [];
    for (let r = 0; r < 9; r++) {
      const row = set.border!.bits.slice(r * 9, (r + 1) * 9);
      borderRows.push(row.split('').filter((b) => b === '1').length);
    }
    expect(borderRows).toEqual([3, 2, 1, 1, 1, 1, 1, 1, 1]);
  });
});

describe('chamfer shape', () => {
  it('border is a perfect diagonal (one pixel per row)', () => {
    for (const gridSize of TEST_GRID_SIZES) {
      const set = generateShape('chamfer', gridSize);
      for (let row = 0; row < gridSize; row++) {
        const rowBits = set.border!.bits.slice(
          row * gridSize,
          (row + 1) * gridSize,
        );
        const count = rowBits.split('').filter((b) => b === '1').length;
        expect(count).toBe(1);

        // Border pixel should be at column (N - 1 - row)
        const expectedCol = gridSize - 1 - row;
        expect(rowBits[expectedCol]).toBe('1');
      }
    }
  });

  it('cover is a triangle — row r has (N-1-r) cover pixels', () => {
    const N = 8;
    const set = generateShape('chamfer', N);
    for (let row = 0; row < N; row++) {
      const rowBits = set.tl.bits.slice(row * N, (row + 1) * N);
      const coverCount = rowBits.split('').filter((b) => b === '1').length;
      expect(coverCount).toBe(N - 1 - row);
    }
  });
});

describe('octagon shape', () => {
  it('has exactly one border pixel per row', () => {
    for (const gridSize of [6, 8, 12, 16]) {
      const set = generateShape('octagon', gridSize);
      for (let row = 0; row < gridSize; row++) {
        const rowBits = set.border!.bits.slice(
          row * gridSize,
          (row + 1) * gridSize,
        );
        const count = rowBits.split('').filter((b) => b === '1').length;
        expect(count).toBe(1);
      }
    }
  });

  it('has three distinct segments (flat-diag-flat)', () => {
    const N = 12;
    const set = generateShape('octagon', N);
    const flatLen = Math.floor(N / 3);

    // Top flat segment: border col should be constant
    const topBorderCols: number[] = [];
    for (let row = 0; row < flatLen; row++) {
      for (let col = 0; col < N; col++) {
        if (set.border!.bits[row * N + col] === '1') {
          topBorderCols.push(col);
          break;
        }
      }
    }
    // All should be the same column
    expect(new Set(topBorderCols).size).toBe(1);

    // Bottom flat segment: border col should be constant at flatLen
    // (the diagonal ends at col = flatLen, and the vertical flat holds there)
    const botBorderCols: number[] = [];
    for (let row = flatLen + (N - 2 * flatLen); row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (set.border!.bits[row * N + col] === '1') {
          botBorderCols.push(col);
          break;
        }
      }
    }
    expect(new Set(botBorderCols).size).toBe(1);
    expect(botBorderCols[0]).toBe(flatLen);
  });
});

describe('scallop shape', () => {
  it('has cover pixels in the TL quadrant area', () => {
    const N = 8;
    const set = generateShape('scallop', N);
    // Top-left pixel (0,0) should be cover (it's the furthest from the arc center)
    expect(set.tl.bits[0]).toBe('1');
  });

  it('bottom-right region is interior', () => {
    const N = 8;
    const set = generateShape('scallop', N);
    // Bottom-right corner should be interior
    expect(set.tl.bits[N * N - 1]).toBe('0');
    expect(set.border!.bits[N * N - 1]).toBe('0');
  });
});

describe('crenellation shape', () => {
  it('has alternating gaps and teeth in the top half', () => {
    const N = 8;
    const toothWidth = Math.max(1, Math.floor(N / 4));
    const set = generateShape('crenellation', N);

    // Row 0 should have cover in the first segment, interior in the second
    const row0 = set.tl.bits.slice(0, N);
    // First toothWidth pixels should be cover
    for (let col = 0; col < toothWidth; col++) {
      expect(row0[col]).toBe('1');
    }
    // Next toothWidth pixels should be interior (not cover)
    for (let col = toothWidth; col < Math.min(2 * toothWidth, N); col++) {
      expect(row0[col]).toBe('0');
    }
  });
});
