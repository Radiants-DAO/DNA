'use client';

import { type MutableRefObject } from 'react';
import { Dotting, type DottingRef, type BrushTool } from '@/lib/dotting';
import { CANVAS_BG_COLOR } from './constants';

interface CanvasAreaProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  brushTool: BrushTool;
  brushColor: string;
  isGridVisible: boolean;
}

export function CanvasArea({ dottingRef, brushTool, brushColor, isGridVisible }: CanvasAreaProps) {
  return (
    <div className="flex-1 min-w-0 min-h-0 bg-depth overflow-hidden">
      <Dotting
        ref={dottingRef}
        width="100%"
        height="100%"
        brushTool={brushTool}
        brushColor={brushColor}
        isGridVisible={isGridVisible}
        isGridFixed={false}
        isPanZoomable={true}
        initAutoScale={true}
        backgroundColor={CANVAS_BG_COLOR}
        defaultPixelColor={CANVAS_BG_COLOR}
        gridStrokeColor="#0f0e0c20"
        gridStrokeWidth={0.5}
        minScale={0.3}
        maxScale={10}
        minColumnCount={2}
        minRowCount={2}
        maxColumnCount={128}
        maxRowCount={128}
      />
    </div>
  );
}
