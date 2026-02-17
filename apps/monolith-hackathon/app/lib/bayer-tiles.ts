/**
 * Vendored from @dithwather/core — Bayer tile precomputation for dither dissolve.
 * Only the subset needed by useDitherDissolve is included.
 */

export type OrderedAlgorithm = 'bayer2x2' | 'bayer4x4' | 'bayer8x8';

type BayerMatrix = number[][];

const BAYER_MATRICES: Record<string, BayerMatrix> = {
  bayer2x2: [
    [0 / 4, 2 / 4],
    [3 / 4, 1 / 4],
  ],
  bayer4x4: [
    [0 / 16, 8 / 16, 2 / 16, 10 / 16],
    [12 / 16, 4 / 16, 14 / 16, 6 / 16],
    [3 / 16, 11 / 16, 1 / 16, 9 / 16],
    [15 / 16, 7 / 16, 13 / 16, 5 / 16],
  ],
  bayer8x8: [
    [0 / 64, 32 / 64, 8 / 64, 40 / 64, 2 / 64, 34 / 64, 10 / 64, 42 / 64],
    [48 / 64, 16 / 64, 56 / 64, 24 / 64, 50 / 64, 18 / 64, 58 / 64, 26 / 64],
    [12 / 64, 44 / 64, 4 / 64, 36 / 64, 14 / 64, 46 / 64, 6 / 64, 38 / 64],
    [60 / 64, 28 / 64, 52 / 64, 20 / 64, 62 / 64, 30 / 64, 54 / 64, 22 / 64],
    [3 / 64, 35 / 64, 11 / 64, 43 / 64, 1 / 64, 33 / 64, 9 / 64, 41 / 64],
    [51 / 64, 19 / 64, 59 / 64, 27 / 64, 49 / 64, 17 / 64, 57 / 64, 25 / 64],
    [15 / 64, 47 / 64, 7 / 64, 39 / 64, 13 / 64, 45 / 64, 5 / 64, 37 / 64],
    [63 / 64, 31 / 64, 55 / 64, 23 / 64, 61 / 64, 29 / 64, 53 / 64, 21 / 64],
  ],
};

const TILE_BITS = new Map<string, number>();

function precompute(): void {
  const algorithms: OrderedAlgorithm[] = ['bayer2x2', 'bayer4x4', 'bayer8x8'];
  for (const alg of algorithms) {
    const matrix = BAYER_MATRICES[alg];
    if (!matrix) continue;
    const size = matrix.length;
    const total = size * size;
    const cells: Array<{ x: number; y: number; val: number }> = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        cells.push({ x, y, val: matrix[y][x] });
      }
    }
    cells.sort((a, b) => a.val - b.val);
    let bits = 0;
    TILE_BITS.set(`${alg}_0`, 0);
    for (let level = 1; level <= total; level++) {
      const { x, y } = cells[level - 1];
      bits |= 1 << (y * size + x);
      TILE_BITS.set(`${alg}_${level}`, bits);
    }
  }
}

precompute();

function thresholdToLevel(algorithm: OrderedAlgorithm, threshold: number): number {
  const matrix = BAYER_MATRICES[algorithm];
  if (!matrix) return 0;
  const size = matrix.length;
  const total = size * size;
  return Math.round(Math.max(0, Math.min(1, threshold)) * total);
}

export function getTileSize(algorithm: OrderedAlgorithm): number {
  const matrix = BAYER_MATRICES[algorithm];
  return matrix ? matrix.length : 4;
}

const dataURLCache = new Map<string, string>();

export function getTileDataURL(algorithm: OrderedAlgorithm, threshold: number): string {
  const level = thresholdToLevel(algorithm, threshold);
  const cacheKey = `${algorithm}_${level}`;
  const cached = dataURLCache.get(cacheKey);
  if (cached) return cached;

  const bits = TILE_BITS.get(cacheKey) ?? 0;
  const size = getTileSize(algorithm);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bitIndex = y * size + x;
      const isOn = (bits >> bitIndex) & 1;
      const i = (y * size + x) * 4;
      data[i] = isOn ? 255 : 0;
      data[i + 1] = isOn ? 255 : 0;
      data[i + 2] = isOn ? 255 : 0;
      data[i + 3] = isOn ? 255 : 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL('image/png');
  dataURLCache.set(cacheKey, url);
  return url;
}
