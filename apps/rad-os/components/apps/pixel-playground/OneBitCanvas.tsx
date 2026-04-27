'use client';

import { useMemo, type MutableRefObject } from 'react';
import {
  Dotting,
  type DottingRef,
  type BrushTool,
  type LayerProps,
  type PixelModifyItem,
} from '@/lib/dotting';
import { useResolvedColor } from '@/hooks';

export interface OneBitCanvasProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  gridSize: number;
  brushTool: BrushTool;
  /** When true, strokes paint FG (ink). When false, paint BG (page). */
  brushIsFg: boolean;
  isGridVisible: boolean;
  /** Monotonic key — increment to force re-mount when forking/resizing. */
  canvasKey: number;
  initialBits?: string; // optional starting bitstring (length = gridSize²)
}

function bitsToInitLayers(
  bits: string,
  size: number,
  fg: string,
  bg: string,
): LayerProps[] {
  const origin = -Math.floor(size / 2);
  const data: PixelModifyItem[][] = [];
  for (let r = 0; r < size; r++) {
    const row: PixelModifyItem[] = [];
    for (let c = 0; c < size; c++) {
      const on = bits.charAt(r * size + c) === '1';
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: on ? fg : bg,
      });
    }
    data.push(row);
  }
  return [{ id: 'default', data }];
}

export function OneBitCanvas({
  dottingRef,
  gridSize,
  brushTool,
  brushIsFg,
  isGridVisible,
  canvasKey,
  initialBits,
}: OneBitCanvasProps) {
  const fg = useResolvedColor('--color-ink', '#0f0e0c');
  const bg = useResolvedColor('--color-page', '#fef8e2');
  const gridStroke = useResolvedColor('--color-rule', '#0f0e0c20');

  const initLayers = useMemo(
    () =>
      bitsToInitLayers(
        initialBits ?? '0'.repeat(gridSize * gridSize),
        gridSize,
        fg,
        bg,
      ),
    [initialBits, gridSize, fg, bg],
  );

  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-depth flex items-center justify-center">
      <div className="aspect-square max-w-full max-h-full h-full w-auto">
        <Dotting
          key={canvasKey}
          ref={dottingRef}
          width="100%"
          height="100%"
          brushTool={brushTool}
          brushColor={brushIsFg ? fg : bg}
          isGridVisible={isGridVisible}
          isGridFixed={true}
          isPanZoomable={false}
          initAutoScale={true}
          initLayers={initLayers}
          backgroundColor={bg}
          defaultPixelColor={bg}
          gridStrokeColor={gridStroke}
          gridStrokeWidth={0.5}
          minScale={0.3}
          maxScale={10}
          minColumnCount={gridSize}
          minRowCount={gridSize}
          maxColumnCount={gridSize}
          maxRowCount={gridSize}
        />
      </div>
    </div>
  );
}
