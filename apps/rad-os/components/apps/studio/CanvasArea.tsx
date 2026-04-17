'use client';

import { type MutableRefObject } from 'react';
import { Dotting, type DottingRef, type BrushTool, type LayerProps } from '@/lib/dotting';
import { usePreferencesStore } from '@/store';
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
  const darkMode = usePreferencesStore((state) => state.darkMode);
  const gridStrokeColor = darkMode ? '#fef8e220' : '#0f0e0c20';
  return (
    // Outer: fills the available space in the editor row; establishes a size-type
    // container so the inner square can read both `cqw` and `cqh`.
    <div
      className="flex-1 min-w-0 min-h-0 bg-depth grid place-items-center p-3"
      style={{ containerType: 'size' }}
    >
      {/* Inner: always square, always fits — side = min(container width, container height). */}
      <div style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}>
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
    </div>
  );
}
