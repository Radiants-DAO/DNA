import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { svgToGrid } from '../import';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function readFixture(name: string): Promise<string> {
  return readFile(resolve(FIXTURES_DIR, name), 'utf8');
}

describe('svgToGrid', () => {
  it('imports integer-grid rectilinear SVGs', async () => {
    const svg = await readFixture('integer-grid.svg');
    const { grid, report } = svgToGrid('integer-grid', svg, {
      size: 4,
      snapStep: 0.5,
    });

    expect(grid.width).toBe(4);
    expect(grid.height).toBe(4);
    expect(grid.bits).toBe('1000000000100000');
    expect(report.snappedValues).toBe(0);
    expect(report.offGridValues).toEqual([]);
    expect(report.hadCurves).toBe(false);
    expect(report.hadDiagonalSegments).toBe(false);
  });

  it('normalizes half-step jitter and records snapping', async () => {
    const svg = await readFixture('half-step-24.svg');
    const { grid, report } = svgToGrid('half-step', svg, {
      size: 24,
      snapStep: 0.5,
    });

    const setBits = [...grid.bits].filter((bit) => bit === '1').length;
    expect(setBits).toBe(1);
    expect(grid.bits[2 * 24 + 1]).toBe('1');
    expect(report.snappedValues).toBeGreaterThan(0);
    expect(report.offGridValues).toEqual([]);
  });

  it('reports off-grid values instead of silently dropping them', async () => {
    const svg = await readFixture('off-grid.svg');
    const { grid, report } = svgToGrid('off-grid', svg, {
      size: 4,
      snapStep: 0.5,
    });

    expect(report.offGridValues).toContain(0.63);
    expect([...grid.bits].filter((bit) => bit === '1')).toHaveLength(1);
  });

  it('rejects curved path commands', async () => {
    const svg = await readFixture('curve.svg');
    expect(() => svgToGrid('curve', svg, { size: 4, snapStep: 0.5 })).toThrow(
      'Curved path commands are not supported',
    );
  });

  it('rejects diagonal segments', async () => {
    const svg = await readFixture('diagonal.svg');
    expect(() => svgToGrid('diagonal', svg, { size: 4, snapStep: 0.5 })).toThrow(
      'Diagonal path segments are not supported',
    );
  });
});
