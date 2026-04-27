import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { svgToGrid } from '../import';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const ICONS_24_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../radiants/assets/icons/24px',
);

async function readFixture(name: string): Promise<string> {
  return readFile(resolve(FIXTURES_DIR, name), 'utf8');
}

async function readIcon24(name: string): Promise<string> {
  return readFile(resolve(ICONS_24_DIR, name), 'utf8');
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

  it('imports diagonal segments and records them in the report', async () => {
    const svg = await readFixture('diagonal.svg');
    const { grid, report } = svgToGrid('diagonal', svg, {
      size: 4,
      snapStep: 0.5,
    });

    expect(grid.bits[0]).toBe('1');
    expect([...grid.bits].filter((bit) => bit === '1')).toHaveLength(1);
    expect(report.hadDiagonalSegments).toBe(true);
  });

  it('preserves compound-path holes from real 24px icons', async () => {
    const svg = await readIcon24('coding-apps-websites-music-player.svg');
    const { grid } = svgToGrid('music-player', svg, {
      size: 24,
      snapStep: 0.5,
    });

    expect(grid.bits[8 * 24 + 12]).toBe('0');
    expect(grid.bits[4 * 24 + 3]).toBe('1');
    expect(grid.bits[13 * 24 + 19]).toBe('1');
  });

  it.each(['svg', 'g'] as const)(
    'inherits evenodd fill-rule from <%s> ancestors',
    (containerTag) => {
      const path =
        '<path d="M0.5 0.5H3.5V3.5H0.5ZM1.5 1.5H2.5V2.5H1.5Z" fill="#000001"/>';
      const svg =
        containerTag === 'svg'
          ? `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" fill-rule="evenodd" xmlns="http://www.w3.org/2000/svg">${path}</svg>`
          : `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd">${path}</g></svg>`;

      const { grid } = svgToGrid(`evenodd-${containerTag}`, svg, {
        size: 4,
        snapStep: 0.5,
      });

      expect(grid.bits[1 * 4 + 1]).toBe('0');
      expect(grid.bits[0]).toBe('1');
    },
  );
});
