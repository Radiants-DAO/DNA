'use client';

import { type MutableRefObject } from 'react';
import { Dotting, type DottingRef, type BrushTool, type LayerProps } from '@/lib/dotting';
import { useResolvedColor } from '@/hooks';
import { CANVAS_BG_COLOR, CANVAS_SIZE } from './constants';

interface CanvasAreaProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  brushTool: BrushTool;
  brushColor: string;
  isGridVisible: boolean;
  initLayers?: LayerProps[];
}

export function CanvasArea({
  dottingRef,
  brushTool,
  brushColor,
  isGridVisible,
  initLayers,
}: CanvasAreaProps) {
  const gridStrokeColor = useResolvedColor('--color-rule', '#0f0e0c20');
  return (
    <div className="w-full h-full bg-depth">
      <Dotting
        ref={dottingRef}
        width="100%"
        height="100%"
        brushTool={brushTool}
        brushColor={brushColor}
        isGridVisible={isGridVisible}
        isGridFixed={true}
        isPanZoomable={false}
        initAutoScale={true}
        initLayers={initLayers}
        backgroundColor={CANVAS_BG_COLOR}
        defaultPixelColor={CANVAS_BG_COLOR}
        gridStrokeColor={gridStrokeColor}
        gridStrokeWidth={0.5}
        minScale={0.3}
        maxScale={10}
        minColumnCount={CANVAS_SIZE}
        minRowCount={CANVAS_SIZE}
        maxColumnCount={CANVAS_SIZE}
        maxRowCount={CANVAS_SIZE}
      />
    </div>
  );
}
