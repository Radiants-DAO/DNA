import { generateCorner } from '../../generate.js';
import type { PixelCornerSet } from '../../types.js';
import type { BuiltInCornerShapeName } from '../types.js';

export type CornerShapeGenerator = (gridSize: number) => PixelCornerSet;

function makeGrids(
  shapeName: string,
  size: number,
  coverBits: string[],
  borderBits: string[],
): PixelCornerSet {
  return {
    name: `${shapeName}-${size}`,
    tl: {
      name: `corner-${shapeName}-${size}-cover`,
      width: size,
      height: size,
      bits: coverBits.join(''),
    },
    border: {
      name: `corner-${shapeName}-${size}-border`,
      width: size,
      height: size,
      bits: borderBits.join(''),
    },
  };
}

function assertValidGridSize(gridSize: number, shapeName: string): void {
  if (!Number.isInteger(gridSize) || gridSize < 2) {
    throw new Error(`${shapeName}: gridSize must be an integer >= 2, got ${gridSize}`);
  }
}

function generateCircle(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'circle');
  return generateCorner(gridSize - 1);
}

function generateChamfer(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'chamfer');
  const size = gridSize;
  const coverBits = new Array(size * size).fill('0');
  const borderBits = new Array(size * size).fill('0');

  for (let row = 0; row < size; row++) {
    const borderCol = size - 1 - row;

    for (let col = 0; col < borderCol; col++) {
      coverBits[row * size + col] = '1';
    }

    borderBits[row * size + borderCol] = '1';
  }

  return makeGrids('chamfer', size, coverBits, borderBits);
}

function generateScallop(gridSize: number): PixelCornerSet {
  assertValidGridSize(gridSize, 'scallop');
  const size = gridSize;
  const coverBits = new Array(size * size).fill('0');
  const borderBits = new Array(size * size).fill('0');
  const cx = size - 1;
  const cy = size - 1;
  const radius = size - 1;

  for (let row = 0; row < size; row++) {
    let borderCol = -1;

    for (let col = 0; col < size; col++) {
      const dx = cx - col;
      const dy = cy - row;
      const dist2 = dx * dx + dy * dy;

      if (dist2 > radius * radius) {
        coverBits[row * size + col] = '1';
      } else if (borderCol === -1) {
        borderCol = col;
      }
    }

    if (borderCol >= 0) {
      borderBits[row * size + borderCol] = '1';
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size; row++) {
      const dx = cx - col;
      const dy = cy - row;

      if (dx * dx + dy * dy <= radius * radius) {
        borderBits[row * size + col] = '1';
        break;
      }
    }
  }

  for (let index = 0; index < size * size; index++) {
    if (coverBits[index] === '1' && borderBits[index] === '1') {
      borderBits[index] = '0';
    }
  }

  return makeGrids('scallop', size, coverBits, borderBits);
}

export const BUILT_IN_CORNER_GENERATORS: ReadonlyMap<
  BuiltInCornerShapeName,
  CornerShapeGenerator
> = new Map([
  ['circle', generateCircle],
  ['chamfer', generateChamfer],
  ['scallop', generateScallop],
]);
