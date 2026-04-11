'use client';

import { useRef, useState } from 'react';
import { type DottingRef, BrushTool, useBrush } from '@/lib/dotting';
import { CanvasArea } from './CanvasArea';
import { ToolPalette } from './ToolPalette';
import { ColorPalette } from './ColorPalette';
import { EditorToolbar } from './EditorToolbar';
import { LayerPanel } from './LayerPanel';
import { StatusBar } from './StatusBar';
import { DEFAULT_BRUSH_COLOR } from './constants';

export default function PixelArtEditor() {
  const dottingRef = useRef<DottingRef>(null);
  const { brushTool, brushColor, changeBrushTool, changeBrushColor } = useBrush(dottingRef);
  const [isGridVisible, setIsGridVisible] = useState(true);

  const activeTool = brushTool ?? BrushTool.DOT;
  const activeColor = brushColor ?? DEFAULT_BRUSH_COLOR;

  return (
    <div className="flex flex-col h-full w-full bg-page">
      {/* Top Toolbar */}
      <EditorToolbar
        dottingRef={dottingRef}
        isGridVisible={isGridVisible}
        onGridToggle={setIsGridVisible}
      />

      {/* Main area: left sidebar + canvas + right sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: tools + colors */}
        <div className="flex flex-col gap-2 p-2 shrink-0 border-r border-rule">
          <ToolPalette activeTool={activeTool} onToolChange={changeBrushTool} />
          <div className="border-t border-rule" />
          <ColorPalette activeColor={activeColor} onColorChange={changeBrushColor} />
        </div>

        {/* Canvas */}
        <CanvasArea
          dottingRef={dottingRef}
          brushTool={activeTool}
          brushColor={activeColor}
          isGridVisible={isGridVisible}
        />

        {/* Right sidebar: layers */}
        <LayerPanel dottingRef={dottingRef} />
      </div>

      {/* Status Bar */}
      <StatusBar dottingRef={dottingRef} activeTool={activeTool} activeColor={activeColor} />
    </div>
  );
}
