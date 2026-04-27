import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { convertSvgIconToPixelGrid } from '../icons.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ICONS_16_DIR = resolve(ROOT, '../../../radiants/assets/icons/16px');
const ICONS_24_DIR = resolve(ROOT, '../../../radiants/assets/icons/24px');
const FIXTURES_DIR = resolve(ROOT, 'fixtures');

async function readIcon(set: 16 | 24, fileName: string): Promise<string> {
  const directory = set === 16 ? ICONS_16_DIR : ICONS_24_DIR;
  return readFile(resolve(directory, fileName), 'utf8');
}

async function readFixture(name: string): Promise<string> {
  return readFile(resolve(FIXTURES_DIR, name), 'utf8');
}

describe('convertSvgIconToPixelGrid', () => {
  it('converts a 16px Radiants icon into a prepared bitgrid icon', async () => {
    const svg = await readIcon(16, 'search.svg');
    const converted = convertSvgIconToPixelGrid('search', svg, {
      size: 16,
      iconSet: 16,
      snapStep: 0.5,
    });

    expect(converted.width).toBe(16);
    expect(converted.height).toBe(16);
    expect(converted.bits).toHaveLength(16 * 16);
    expect(converted.path).toMatch(/^M/);
    expect(converted.maskImage).toContain('data:image/svg+xml');
    expect(converted.report.hadCurves).toBe(false);
    expect(converted.report.hadDiagonalSegments).toBe(false);
    expect(converted.bits.slice(2 * 16, 3 * 16)).toBe('0000111100000000');
    expect(converted.bits.slice(3 * 16, 4 * 16)).toBe('0001000010000000');
    expect(converted.bits.slice(10 * 16, 11 * 16)).toBe('0000000001110000');
  });

  it('applies rotated-rect transforms for vertical ellipsis icons', async () => {
    const svg = await readIcon(16, 'more-vertical.svg');
    const converted = convertSvgIconToPixelGrid('more-vertical', svg, {
      size: 16,
      iconSet: 16,
      snapStep: 0.5,
    });

    expect(converted.width).toBe(16);
    expect(converted.height).toBe(16);
    expect(converted.bits.slice(3 * 16, 4 * 16)).toBe('0000000110000000');
    expect(converted.bits.slice(7 * 16, 8 * 16)).toBe('0000000110000000');
    expect(converted.bits.slice(11 * 16, 12 * 16)).toBe('0000000110000000');
    expect(converted.report.offGridValues).toEqual([]);
  });

  it('converts a 24px Radiants icon into a prepared bitgrid icon', async () => {
    const svg = await readIcon(24, 'coding-apps-websites-music-player.svg');
    const converted = convertSvgIconToPixelGrid('music-player', svg, {
      size: 24,
      iconSet: 24,
      snapStep: 0.5,
    });

    expect(converted.width).toBe(21);
    expect(converted.height).toBe(21);
    expect(converted.bits).toHaveLength(21 * 21);
    expect(converted.path).toMatch(/^M/);
    expect(converted.report.offGridValues).toEqual([]);
    expect(converted.report.hadCurves).toBe(false);
    expect(converted.report.hadDiagonalSegments).toBe(false);
    expect(converted.bits.slice(0, 21)).toBe('011111111111111111110');
    expect(converted.bits.slice(4 * 21, 5 * 21)).toBe('101000000011100000101');
    expect(converted.bits.slice(20 * 21, 21 * 21)).toBe('011111111111111111110');
  });

  it('keeps mixed-axis 24px icons structurally intact', async () => {
    const svg = await readIcon(24, 'interface-essential-bin.svg');
    const converted = convertSvgIconToPixelGrid('interface-essential-bin', svg, {
      size: 24,
      iconSet: 24,
      snapStep: 0.5,
    });

    expect(converted.width).toBe(21);
    expect(converted.height).toBe(21);
    expect(converted.bits.slice(0, 21)).toBe('000000000000000000000');
    expect(converted.bits.slice(4 * 21, 5 * 21)).toBe('001111111111111111100');
    expect(converted.bits.slice(9 * 21, 10 * 21)).toBe('000100100010001001000');
    expect(converted.bits.slice(20 * 21, 21 * 21)).toBe('000001111111111100000');
  });

  it('converts diagonal pixel icons without throwing', async () => {
    const svg = await readFixture('diagonal.svg');
    const converted = convertSvgIconToPixelGrid('diagonal', svg, {
      size: 4,
      snapStep: 0.5,
    });

    expect(converted.width).toBe(4);
    expect(converted.height).toBe(4);
    expect(converted.bits).toHaveLength(4 * 4);
    expect(converted.report.hadDiagonalSegments).toBe(true);
  });
});
