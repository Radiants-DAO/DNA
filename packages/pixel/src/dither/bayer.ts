export type BayerMatrixSize = 2 | 4 | 8 | 16;

const BASE: readonly (readonly number[])[] = [
  [0, 2],
  [3, 1],
];

function isPowerOfTwoAtLeastTwo(n: number): n is BayerMatrixSize {
  return Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;
}

/**
 * Build the recursive Bayer threshold matrix of side length `n`.
 *
 * Recurrence: B_{2k}[y][x] = 4 * B_k[y mod k][x mod k] + B_2[⌊y/k⌋][⌊x/k⌋].
 *
 * Values span [0, n²) and each value appears exactly once.
 */
export function bayerMatrix(n: BayerMatrixSize): number[][] {
  if (!isPowerOfTwoAtLeastTwo(n)) {
    throw new Error(`bayerMatrix: size must be a power of two ≥ 2, received ${n}`);
  }

  let current: number[][] = BASE.map((row) => [...row]);
  let size = 2;

  while (size < n) {
    const next: number[][] = [];
    const nextSize = size * 2;
    const k = size;
    for (let y = 0; y < nextSize; y++) {
      const row: number[] = [];
      const innerY = y % k;
      const outerY = (y - innerY) / k;
      for (let x = 0; x < nextSize; x++) {
        const innerX = x % k;
        const outerX = (x - innerX) / k;
        row.push(4 * current[innerY][innerX] + BASE[outerY][outerX]);
      }
      next.push(row);
    }
    current = next;
    size = nextSize;
  }

  return current;
}
