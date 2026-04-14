'use client';

import { type MutableRefObject } from 'react';
import { type DottingRef, type BrushTool, useGrids } from '@/lib/dotting';
import { TOOL_DEFS } from './constants';

interface StatusBarProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  activeTool: BrushTool;
  activeColor: string;
}

export function StatusBar({ dottingRef, activeTool, activeColor }: StatusBarProps) {
  const { dimensions } = useGrids(dottingRef);
  const toolDef = TOOL_DEFS.find((d) => d.tool === activeTool);

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 shrink-0 border-t border-rule bg-page">
      <span className="font-joystix text-xs text-sub uppercase tabular-nums">
        {dimensions?.columnCount ?? '—'} × {dimensions?.rowCount ?? '—'}
      </span>
      <span className="font-joystix text-xs text-sub uppercase">
        {toolDef?.label ?? 'Pen'}
      </span>
      <span
        className="w-3 h-3 rounded-full border border-rule shrink-0"
        style={{ backgroundColor: activeColor }}
      />
    </div>
  );
}
