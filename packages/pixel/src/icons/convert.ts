import { svgToGrid } from '../import.ts';
import { bitsToMaskURI, bitsToPath } from '../path.ts';
import type { ConvertedSvgIcon, SvgIconConversionOptions } from './types.ts';

const ICON_24_CANONICAL_TRIM = {
  top: 1,
  right: 2,
  bottom: 2,
  left: 1,
} as const;

function trim24IconToCanonicalLiveArea(bits: string, width: number, height: number) {
  const trimmedWidth = width - ICON_24_CANONICAL_TRIM.left - ICON_24_CANONICAL_TRIM.right;
  const trimmedHeight = height - ICON_24_CANONICAL_TRIM.top - ICON_24_CANONICAL_TRIM.bottom;
  const rows: string[] = [];

  for (let y = ICON_24_CANONICAL_TRIM.top; y < height - ICON_24_CANONICAL_TRIM.bottom; y += 1) {
    const rowStart = y * width;
    const rowEnd = rowStart + width;
    const row = bits.slice(rowStart, rowEnd);
    rows.push(row.slice(ICON_24_CANONICAL_TRIM.left, width - ICON_24_CANONICAL_TRIM.right));
  }

  return {
    bits: rows.join(''),
    width: trimmedWidth,
    height: trimmedHeight,
  };
}

export function convertSvgIconToPixelGrid(
  name: string,
  svg: string,
  options: SvgIconConversionOptions,
): ConvertedSvgIcon {
  const { grid, report } = svgToGrid(name, svg, {
    size: options.size,
    snapStep: options.snapStep,
  });
  const normalizedGrid =
    options.iconSet === 24 && grid.width === 24 && grid.height === 24
      ? {
          ...grid,
          ...trim24IconToCanonicalLiveArea(grid.bits, grid.width, grid.height),
        }
      : grid;
  const path = bitsToPath(normalizedGrid.bits, normalizedGrid.width, normalizedGrid.height);

  return {
    ...normalizedGrid,
    iconSet: options.iconSet,
    path,
    maskImage: bitsToMaskURI(path, normalizedGrid.width, normalizedGrid.height),
    report,
  };
}
