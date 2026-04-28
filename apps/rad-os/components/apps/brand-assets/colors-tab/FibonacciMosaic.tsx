'use client';

import { useId } from 'react';
import { getPattern, bitsToMergedRects, generatePixelCornerBorder } from '@rdna/pixel';
import type { BrandColor, ExtendedColor, FibSlot, FibTile } from './types';
import { BRAND_COLORS, EXTENDED_COLORS } from './data';

const DIAG = (() => {
  const grid = getPattern('diagonal');
  if (!grid) return null;
  return {
    width: grid.width,
    height: grid.height,
    rects: bitsToMergedRects(grid.bits, grid.width, grid.height),
  };
})();

// Pixel-art Fibonacci spiral overlay: one quarter-arc per square, alternating
// pivot corner as the spiral winds. Pivot = corner the arc curves AWAY from.
type PivotCorner = 'TL' | 'TR' | 'BL' | 'BR';

interface SpiralArcConfig {
  size: number;
  colStart: number; // 0-indexed grid col
  rowStart: number; // 0-indexed grid row
  pivot: PivotCorner;
}

const SPIRAL_ARCS: readonly SpiralArcConfig[] = [
  { size: 21, colStart: 0,  rowStart: 0,  pivot: 'BR' },
  { size: 13, colStart: 21, rowStart: 0,  pivot: 'BL' },
  { size: 8,  colStart: 26, rowStart: 13, pivot: 'TL' },
  { size: 5,  colStart: 21, rowStart: 16, pivot: 'TR' },
  { size: 3,  colStart: 21, rowStart: 13, pivot: 'BR' },
  { size: 2,  colStart: 24, rowStart: 13, pivot: 'BL' },
  { size: 1,  colStart: 24, rowStart: 15, pivot: 'TL' },
];

function transformCell(col: number, row: number, R: number, pivot: PivotCorner): [number, number] {
  switch (pivot) {
    case 'BR': return [col, row];
    case 'TR': return [col, R - 1 - row];
    case 'BL': return [R - 1 - col, row];
    case 'TL': return [R - 1 - col, R - 1 - row];
  }
}

// Fine spiral: each arc-pixel is 1/SUBDIV of a grid unit — smaller than one
// mosaic cell, so the curve reads as a thin pixelated line.
const SUBDIV = 20;

interface SpiralRect { x: number; y: number; size: number }

const SPIRAL_CELLS: readonly SpiralRect[] = (() => {
  const cells: SpiralRect[] = [];
  for (const arc of SPIRAL_ARCS) {
    const pixelRes = arc.size * SUBDIV;
    const cellSize = 1 / SUBDIV;
    const border = generatePixelCornerBorder(pixelRes);
    for (const [col, row] of border) {
      const [tCol, tRow] = transformCell(col, row, pixelRes, arc.pivot);
      cells.push({
        x: arc.colStart + tCol * cellSize,
        y: arc.rowStart + tRow * cellSize,
        size: cellSize,
      });
    }
  }
  return cells;
})();

function SelectionPattern({ color }: { color: string }) {
  const id = useId();
  if (!DIAG) return null;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-desktop"
      aria-hidden
      shapeRendering="crispEdges"
      style={{ color }}
    >
      <defs>
        <pattern id={id} width={DIAG.width} height={DIAG.height} patternUnits="userSpaceOnUse">
          {DIAG.rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="currentColor" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

interface FibonacciMosaicProps {
  selectedCssVar: string;
  onSelect: (color: BrandColor | ExtendedColor) => void;
}

const ALL_PRIMITIVES: readonly (BrandColor | ExtendedColor)[] = [
  ...BRAND_COLORS,
  ...EXTENDED_COLORS,
];

const byVar = (cssVar: string) =>
  ALL_PRIMITIVES.find((c) => c.cssVar === cssVar)!;

const HIERARCHY: readonly FibTile[] = [
  { slot: 21, tones: [byVar('--color-sun-yellow')] },
  { slot: 13, tones: [byVar('--color-cream'), byVar('--color-pure-white')] },
  { slot: 8,  tones: [byVar('--color-ink'),   byVar('--color-pure-black')] },
  { slot: 5,  tones: [byVar('--color-mint')] },
  { slot: 3,  tones: [byVar('--color-sky-blue')] },
  { slot: 2,  tones: [byVar('--color-sun-red')] },
  { slot: 1,  tones: [byVar('--color-sunset-fuzz')] },
];

// Horizontal 34×21 rectangle. colStart/colEnd/rowStart/rowEnd (end-exclusive).
// CCW spiral: 21 left → 13 top-right → 8 right-bottom → 5 inside-bottom-left
// → 3 inside-top-left → 2 inside-top-right → 1 inside-middle.
const PLACEMENT: Record<FibSlot, [number, number, number, number]> = {
  21: [1, 22,  1, 22],
  13: [22, 35, 1, 14],
  8:  [27, 35, 14, 22],
  5:  [22, 27, 17, 22],
  3:  [22, 25, 14, 17],
  2:  [25, 27, 14, 16],
  1:  [25, 27, 16, 17],
};

const INK_VARS = new Set(['--color-ink', '--color-pure-black']);
const INK_LINE_OVERRIDE = 'var(--color-pure-white)';

export function FibonacciMosaic({ selectedCssVar, onSelect }: FibonacciMosaicProps) {
  const tiles = HIERARCHY;
  const lineCss = 'var(--color-ink)';

  // Region of the mosaic where ink/pure-black tiles live — spiral/selection
  // lines switch to white here so they remain visible.
  const inkSlot = tiles.find((t) => t.tones.some((tone) => INK_VARS.has(tone.cssVar)));
  const inkBox = inkSlot
    ? (() => {
        const [cs, ce, rs, re] = PLACEMENT[inkSlot.slot];
        return { xMin: cs - 1, xMax: ce - 1, yMin: rs - 1, yMax: re - 1 };
      })()
    : null;

  return (
    <div
      className="relative grid w-full h-full gap-px"
      style={{
        gridTemplateColumns: 'repeat(34, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(21, minmax(0, 1fr))',
        backgroundColor: lineCss,
      }}
    >
      {/* Pixelated Fibonacci spiral overlay — one quarter-arc per square. */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-desktop"
        viewBox="0 0 34 21"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden
        style={{ color: lineCss }}
      >
        {SPIRAL_CELLS.map((c, i) => {
          const inInk =
            inkBox &&
            c.x >= inkBox.xMin && c.x < inkBox.xMax &&
            c.y >= inkBox.yMin && c.y < inkBox.yMax;
          return (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.size}
              height={c.size}
              fill={inInk ? INK_LINE_OVERRIDE : 'currentColor'}
            />
          );
        })}
      </svg>

      {tiles.map(({ slot, tones }) => {
        const [colStart, colEnd, rowStart, rowEnd] = PLACEMENT[slot];
        return (
          <div
            key={slot}
            className="flex flex-col gap-px relative"
            style={{
              gridColumn: `${colStart} / ${colEnd}`,
              gridRow: `${rowStart} / ${rowEnd}`,
              backgroundColor: lineCss,
            }}
          >
            {tones.map((tone) => (
              <MosaicTile
                key={tone.cssVar}
                color={tone}
                selected={tone.cssVar === selectedCssVar}
                lineColor={lineCss}
                onSelect={onSelect}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface MosaicTileProps {
  color: BrandColor | ExtendedColor;
  selected: boolean;
  lineColor: string;
  onSelect: (color: BrandColor | ExtendedColor) => void;
}

function MosaicTile({ color, selected, lineColor, onSelect }: MosaicTileProps) {
  const patternColor = INK_VARS.has(color.cssVar) ? INK_LINE_OVERRIDE : lineColor;
  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:brand-mosaic-tile-art-button owner:design-system expires:2027-01-01 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#brand-mosaic-art-buttons
    <button
      type="button"
      onClick={() => onSelect(color)}
      aria-pressed={selected}
      aria-label={color.name}
      title={color.name}
      className="flex-1 cursor-pointer relative"
    >
      <div data-rdna-brand-primitive className="w-full h-full" style={{ backgroundColor: color.hex }} />
      {selected && <SelectionPattern color={patternColor} />}
    </button>
  );
}
