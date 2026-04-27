'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import {
  bitsToMaskURI,
  bitsToPath,
  corner,
  mirrorForCorner,
  px,
  type CornerShapeName,
  type CornerPosition,
  type PixelGrid,
} from '@rdna/pixel';
import { getCornerShapeFromEntryName } from '../constants';
import {
  DEFAULT_CORNER_PREVIEW_SETTINGS,
  type CornerPreviewSettings,
} from '../types';

interface CornerPreviewProps {
  grid: PixelGrid | null;
  cornerSize: number;
  settings?: CornerPreviewSettings;
}

const PREVIEW_WIDTH_PX = 224;
const PREVIEW_HEIGHT_PX = 160;
const PREVIEW_CENTER_WIDTH_PX = 96;
const PREVIEW_CENTER_HEIGHT_PX = 64;
const CORNER_POSITIONS: readonly CornerPosition[] = ['tl', 'tr', 'br', 'bl'];

function deriveBorderBitsFromCover(grid: PixelGrid): string {
  const bits = grid.bits.split('');
  const borderBits = new Array(grid.width * grid.height).fill('0');

  for (let row = 0; row < grid.height; row += 1) {
    for (let col = 0; col < grid.width; col += 1) {
      const index = row * grid.width + col;
      if (bits[index] === '1') continue;

      const touchesCover =
        (row > 0 && bits[(row - 1) * grid.width + col] === '1') ||
        (row < grid.height - 1 && bits[(row + 1) * grid.width + col] === '1') ||
        (col > 0 && bits[row * grid.width + col - 1] === '1') ||
        (col < grid.width - 1 && bits[row * grid.width + col + 1] === '1');

      if (touchesCover) {
        borderBits[index] = '1';
      }
    }
  }

  return borderBits.join('');
}

function buildGridCornerStyle(grid: PixelGrid | null): CSSProperties {
  if (!grid) return {};

  const style: Record<string, string> = {};
  const borderBits = deriveBorderBitsFromCover(grid);

  for (const position of CORNER_POSITIONS) {
    const cornerGrid = mirrorForCorner(grid, position);
    const borderGrid = mirrorForCorner(
      {
        ...grid,
        bits: borderBits,
      },
      position,
    );
    const coverPath = bitsToPath(cornerGrid.bits, cornerGrid.width, cornerGrid.height);
    const borderPath = bitsToPath(borderGrid.bits, borderGrid.width, borderGrid.height);
    style[`--px-${position}-cover`] = bitsToMaskURI(
      coverPath,
      cornerGrid.width,
      cornerGrid.height,
    );
    style[`--px-${position}-border`] = bitsToMaskURI(
      borderPath,
      borderGrid.width,
      borderGrid.height,
    );
    style[`--px-${position}-s`] = `calc(${cornerGrid.width}px * var(--pixel-scale, 1))`;
  }

  return style as CSSProperties;
}

export function CornerPreview({
  grid,
  cornerSize,
  settings,
}: CornerPreviewProps) {
  const resolvedSettings = settings ?? DEFAULT_CORNER_PREVIEW_SETTINGS;
  const selectedShape = getCornerShapeFromEntryName(grid?.name);
  const shape = selectedShape ?? 'circle';
  const usesGridOverride = Boolean(grid && !selectedShape);
  const radiusPx = Math.max(1, cornerSize - 1);
  const cornerMaskPx = (radiusPx + 1) * resolvedSettings.pixelScale;
  const previewWidth = Math.max(PREVIEW_WIDTH_PX, cornerMaskPx * 2 + PREVIEW_CENTER_WIDTH_PX);
  const previewHeight = Math.max(PREVIEW_HEIGHT_PX, cornerMaskPx * 2 + PREVIEW_CENTER_HEIGHT_PX);
  const gridCornerStyle = useMemo(
    () => (usesGridOverride ? buildGridCornerStyle(grid) : {}),
    [grid, usesGridOverride],
  );
  const pixelProps = px({
    corners: corner.map(corner.fixed(shape as CornerShapeName, radiusPx)),
  });
  const pixelStyle = {
    ...pixelProps.style,
    ...gridCornerStyle,
    '--pixel-scale': resolvedSettings.pixelScale,
  } as CSSProperties;
  const cornerSource = usesGridOverride ? 'grid' : 'registry';

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto bg-depth p-5">
      <div
        className="relative isolate"
        style={{
          width: previewWidth,
          height: previewHeight,
          '--pixel-scale': resolvedSettings.pixelScale,
        } as CSSProperties}
      >
        <div
          aria-hidden
          className={`${pixelProps.className} pat-pixel-shadow`}
          style={pixelStyle}
        >
          <div className="pat-pixel-shadow__fill" />
        </div>
        <div
          aria-label="Corner shape preview"
          className={`${pixelProps.className} relative flex h-full w-full items-center justify-center bg-page text-main`}
          data-corner-mask-px={cornerMaskPx}
          data-corner-shape={usesGridOverride ? undefined : shape}
          data-corner-source={cornerSource}
          data-pixel-scale={resolvedSettings.pixelScale}
          data-preview-kind="single-box"
          style={pixelStyle}
        >
          <div aria-hidden className="flex w-24 flex-col gap-3">
            <span className="h-px w-full bg-rule" />
            <span className="h-px w-16 bg-rule" />
          </div>
        </div>
      </div>
    </div>
  );
}
