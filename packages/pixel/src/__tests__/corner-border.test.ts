import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePixelCornerBorder } from '../corner-border.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', 'test', 'fixtures');

/**
 * Parse an SVG fixture with H/V-only subpaths into a sorted list of [col,row]
 * cells. Each `M x y ... Z` subpath describes a filled rect; we extract it
 * from the bounding box of its vertices and enumerate the unit cells inside.
 */
function parseCornerFixture(filename: string): Array<[number, number]> {
  const svg = readFileSync(join(fixturesDir, filename), 'utf8');
  const pathMatch = svg.match(/<path[^>]*\sd="([^"]+)"/);
  if (!pathMatch) throw new Error(`no <path d="..."> in ${filename}`);
  const d = pathMatch[1];

  const cells = new Set<string>();

  for (const sub of d.split('Z').map((s) => s.trim()).filter(Boolean)) {
    const tokens = sub.match(/[MHV]|-?\d+(?:\.\d+)?/g) ?? [];
    let x = 0;
    let y = 0;
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i < tokens.length; ) {
      const t = tokens[i];
      if (t === 'M') {
        x = Number(tokens[i + 1]);
        y = Number(tokens[i + 2]);
        xs.push(x);
        ys.push(y);
        i += 3;
      } else if (t === 'H') {
        x = Number(tokens[i + 1]);
        xs.push(x);
        i += 2;
      } else if (t === 'V') {
        y = Number(tokens[i + 1]);
        ys.push(y);
        i += 2;
      } else {
        i += 1;
      }
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    for (let ry = minY; ry < maxY; ry++) {
      for (let rx = minX; rx < maxX; rx++) {
        cells.add(`${rx},${ry}`);
      }
    }
  }

  return [...cells]
    .map((s) => s.split(',').map(Number) as [number, number])
    .sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
}

function sortCells(cells: Array<[number, number]>): Array<[number, number]> {
  return [...cells].sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
}

describe('generatePixelCornerBorder', () => {
  it('throws on non-positive / non-integer radius', () => {
    expect(() => generatePixelCornerBorder(0)).toThrow();
    expect(() => generatePixelCornerBorder(-5)).toThrow();
    expect(() => generatePixelCornerBorder(3.5)).toThrow();
  });

  const fixtureRadii = [4, 6, 8, 12, 16, 20] as const;

  for (const R of fixtureRadii) {
    it(`matches hand-drawn fixture for R=${R}`, () => {
      const expected = parseCornerFixture(`corner-${R}.svg`);
      const actual = sortCells(generatePixelCornerBorder(R));
      expect(actual).toEqual(expected);
    });
  }

  it('is diagonally symmetric for assorted radii', () => {
    for (const R of [1, 2, 3, 5, 7, 10, 15, 25, 50, 100]) {
      const cells = generatePixelCornerBorder(R);
      const set = new Set(cells.map(([c, r]) => `${c},${r}`));
      for (const [c, r] of cells) {
        expect(set.has(`${r},${c}`)).toBe(true);
      }
    }
  });

  it('returns exactly one cell per row leftmost-boundary (and per col topmost-boundary)', () => {
    for (const R of [4, 6, 8, 12, 16, 20, 50]) {
      const cells = generatePixelCornerBorder(R);
      const rowLeftmost = new Map<number, number>();
      const colTopmost = new Map<number, number>();
      for (const [c, r] of cells) {
        if (!rowLeftmost.has(r) || c < rowLeftmost.get(r)!) rowLeftmost.set(r, c);
        if (!colTopmost.has(c) || r < colTopmost.get(c)!) colTopmost.set(c, r);
      }
      expect(rowLeftmost.size).toBe(R);
      expect(colTopmost.size).toBe(R);
    }
  });
});
