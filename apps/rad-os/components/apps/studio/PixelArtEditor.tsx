'use client';

import { useCallback, useRef, useState } from 'react';
import {
  type DottingRef,
  type LayerProps,
  type PixelModifyItem,
  BrushTool,
  useBrush,
} from '@/lib/dotting';
import { CanvasArea } from './CanvasArea';
import { ToolPalette } from './ToolPalette';
import { ColorPalette } from './ColorPalette';
import { EditorToolbar } from './EditorToolbar';
import { LayerPanel } from './LayerPanel';
import { StatusBar } from './StatusBar';
import { CANVAS_BG_COLOR, CANVAS_SIZE, DEFAULT_BRUSH_COLOR } from './constants';
import { pickRandomRadiant } from './radnom';

function createEmptyLayer(): LayerProps {
  const origin = -Math.floor(CANVAS_SIZE / 2);
  const data: PixelModifyItem[][] = [];
  for (let r = 0; r < CANVAS_SIZE; r++) {
    const row: PixelModifyItem[] = [];
    for (let c = 0; c < CANVAS_SIZE; c++) {
      row.push({
        rowIndex: origin + r,
        columnIndex: origin + c,
        color: CANVAS_BG_COLOR,
      });
    }
    data.push(row);
  }
  return { id: 'default', data };
}

export default function PixelArtEditor() {
  const dottingRef = useRef<DottingRef>(null);
  const { brushTool, brushColor, changeBrushTool, changeBrushColor } = useBrush(dottingRef);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [initLayers, setInitLayers] = useState<LayerProps[]>(() => [createEmptyLayer()]);
  const [canvasKey, setCanvasKey] = useState(0);

  const activeTool = brushTool ?? BrushTool.DOT;
  const activeColor = brushColor ?? DEFAULT_BRUSH_COLOR;

  const handleRadnom = useCallback(async () => {
    try {
      const data = await pickRandomRadiant();
      setInitLayers([{ id: 'default', data }]);
      setCanvasKey((k) => k + 1);
    } catch (err) {
      console.error('radnom failed', err);
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-page">
      {/* Top Toolbar */}
      <EditorToolbar
        dottingRef={dottingRef}
        isGridVisible={isGridVisible}
        onGridToggle={setIsGridVisible}
        onRadnom={handleRadnom}
      />

      {/* Main area: left sidebar + canvas + right sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: tools + colors */}
        <div className="flex flex-col gap-2 p-2 shrink-0 border-r border-rule">
          <ToolPalette activeTool={activeTool} onToolChange={changeBrushTool} />
          <div className="border-t border-rule" />
          <ColorPalette activeColor={activeColor} onColorChange={changeBrushColor} />
        </div>

        {/* Canvas — re-keyed when Radnom fires so Dotting remounts with fresh initAutoScale */}
        <CanvasArea
          key={canvasKey}
          dottingRef={dottingRef}
          brushTool={activeTool}
          brushColor={activeColor}
          isGridVisible={isGridVisible}
          initLayers={initLayers}
        />

        {/* Right sidebar: layers */}
        <LayerPanel dottingRef={dottingRef} />
      </div>

      {/* Status Bar */}
      <StatusBar dottingRef={dottingRef} activeTool={activeTool} activeColor={activeColor} />
    </div>
  );
}
