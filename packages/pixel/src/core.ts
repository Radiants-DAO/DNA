import type { PixelGrid } from './types.js';

/**
 * Parse a bitstring into a Uint8Array where each element is 0 or 1.
 */
export function parseBits(bits: string): Uint8Array {
  const result = new Uint8Array(bits.length);

  for (let i = 0; i < bits.length; i++) {
    const code = bits.charCodeAt(i);
    if (code === 48) {
      result[i] = 0;
    } else if (code === 49) {
      result[i] = 1;
    } else {
      throw new Error(`Invalid bitstring: unexpected '${bits[i]}' at index ${i}`);
    }
  }

  return result;
}

/**
 * Validate that a grid's bit count matches its dimensions.
 */
export function validateGrid(grid: PixelGrid): void {
  if (!Number.isInteger(grid.width) || grid.width <= 0) {
    throw new Error(`width must be a positive integer, received ${grid.width}`);
  }

  if (!Number.isInteger(grid.height) || grid.height <= 0) {
    throw new Error(`height must be a positive integer, received ${grid.height}`);
  }

  parseBits(grid.bits);

  const expectedLength = grid.width * grid.height;
  if (grid.bits.length !== expectedLength) {
    throw new Error(
      `bits length ${grid.bits.length} !== width(${grid.width}) × height(${grid.height}) = ${expectedLength}`,
    );
  }
}

/**
 * Create a grid and validate its dimensions immediately.
 */
export function bitsToGrid(
  name: string,
  width: number,
  height: number,
  bits: string,
): PixelGrid {
  const grid = { name, width, height, bits };
  validateGrid(grid);
  return grid;
}

/**
 * Convert a space-separated hex string into a square PixelGrid.
 */
export function gridFromHex(
  name: string,
  size: number,
  hex: string,
): PixelGrid {
  const parts = hex.trim().split(/\s+/).filter(Boolean);
  const bits = parts
    .map((part) => {
      if (!/^[\da-fA-F]{2}$/.test(part)) {
        throw new Error(`Invalid hex byte: ${part}`);
      }

      return Number.parseInt(part, 16).toString(2).padStart(8, '0');
    })
    .join('');

  return bitsToGrid(name, size, size, bits);
}

/**
 * Mirror a grid horizontally.
 */
export function mirrorH(grid: PixelGrid): PixelGrid {
  const rows: string[] = [];

  for (let y = 0; y < grid.height; y++) {
    const row = grid.bits.slice(y * grid.width, (y + 1) * grid.width);
    rows.push(row.split('').reverse().join(''));
  }

  return {
    ...grid,
    name: `${grid.name}-mirrorH`,
    bits: rows.join(''),
  };
}

/**
 * Mirror a grid vertically.
 */
export function mirrorV(grid: PixelGrid): PixelGrid {
  const rows: string[] = [];

  for (let y = 0; y < grid.height; y++) {
    rows.push(grid.bits.slice(y * grid.width, (y + 1) * grid.width));
  }

  return {
    ...grid,
    name: `${grid.name}-mirrorV`,
    bits: rows.reverse().join(''),
  };
}

/**
 * Return indices where two bitstrings differ.
 */
export function diffBits(a: string, b: string): number[] {
  if (a.length !== b.length) {
    throw new Error(
      `Bitstrings must have equal length (${a.length} !== ${b.length})`,
    );
  }

  const diff: number[] = [];

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diff.push(i);
    }
  }

  return diff;
}
