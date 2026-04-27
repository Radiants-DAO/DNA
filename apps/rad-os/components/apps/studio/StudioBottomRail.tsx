'use client';

// =============================================================================
// StudioBottomRail — Bottom dock for the Studio editor.
//
// Hosts the live canvas status readout (dimensions + active tool + brush
// color), the grid toggle, and canvas-level actions (Clear, Radnom, Undo,
// Redo). Laid out as a horizontal ControlPanel so each group can live in
// its own ScreenIsland alongside the others.
// =============================================================================

import { type MutableRefObject } from 'react';
import {
  ColorSwatch as CtrlColorSwatch,
  ControlPanel,
  IconCell,
  Toggle,
  Tooltip,
} from '@rdna/ctrl';
import { Icon } from '@rdna/radiants/icons/runtime';
import { type DottingRef, type BrushTool, useGrids } from '@/lib/dotting';
import { TOOL_DEFS } from './constants';
import { ScreenIsland } from './ScreenIsland';

export interface StudioBottomRailProps {
  dottingRef: MutableRefObject<DottingRef | null>;
  activeTool: BrushTool;
  activeColor: string;

  isGridVisible: boolean;
  onGridToggle: (visible: boolean) => void;

  onClear: () => void;
  onRadnom: () => void;
  onUndo: () => void;
  onRedo: () => void;

  orientation?: 'horizontal' | 'vertical';
  showStatus?: boolean;
  showToolStatus?: boolean;
  statusOnly?: boolean;
  className?: string;
}

export function StudioBottomRail({
  dottingRef,
  activeTool,
  activeColor,

  isGridVisible,
  onGridToggle,

  onClear,
  onRadnom,
  onUndo,
  onRedo,

  orientation = 'horizontal',
  showStatus = true,
  showToolStatus = true,
  statusOnly = false,
  className = '',
}: StudioBottomRailProps) {
  const { dimensions } = useGrids(dottingRef);
  const toolDef = TOOL_DEFS.find((d) => d.tool === activeTool);
  const isHorizontal = orientation === 'horizontal';
  const islandClassName = isHorizontal ? 'flex-1' : '';
  const statusReadout = (
    <div className="flex h-8 w-full flex-1 items-stretch justify-center gap-px bg-ink">
      <span className="flex flex-1 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase tabular-nums">
        {dimensions?.columnCount ?? '—'} × {dimensions?.rowCount ?? '—'}
      </span>
      {showToolStatus && (
        <>
          <span className="flex flex-1 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase">
            {toolDef?.label ?? 'Pen'}
          </span>
          <span className="flex flex-1 items-center justify-center bg-ctrl-cell-bg">
            <CtrlColorSwatch color={activeColor} size="sm" borderless />
          </span>
        </>
      )}
    </div>
  );

  if (!isHorizontal) {
    return (
      <div
        data-rdna="studio-bottom-rail"
        data-orientation="vertical"
        className={[
          'grid w-fit grid-cols-[40px_40px] gap-px bg-ink pl-px pr-[2px] py-px',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="group"
        aria-label="Canvas controls"
      >
        {showStatus && (
          <span className="col-span-2 flex h-6 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase tabular-nums">
            {dimensions?.columnCount ?? '—'} × {dimensions?.rowCount ?? '—'}
          </span>
        )}
        {showStatus && showToolStatus && (
          <>
            <span className="col-span-2 flex h-8 items-center justify-center bg-ctrl-cell-bg font-mono text-xs text-main uppercase">
              {toolDef?.label ?? 'Pen'}
            </span>
            <span className="col-span-2 flex h-8 items-center justify-center bg-ctrl-cell-bg">
              <CtrlColorSwatch color={activeColor} size="sm" borderless />
            </span>
          </>
        )}
        {statusOnly ? null : (
          <>
            <Tooltip side="right" content={isGridVisible ? 'Hide grid' : 'Show grid'}>
              <div className="col-span-2 flex h-6 items-center justify-between gap-1 bg-ctrl-cell-bg px-1.5">
                <span className="font-mono text-xs uppercase tracking-wider text-main">Grid</span>
                <Toggle value={isGridVisible} onChange={onGridToggle} size="sm" />
              </div>
            </Tooltip>
            <Tooltip side="right" content="Undo">
              <span className="inline-flex">
                <IconCell mode="button" size="xl" chromeless label="Undo" onClick={onUndo}>
                  <Icon name="interface-essential-navigation-left-circle-1" large />
                </IconCell>
              </span>
            </Tooltip>
            <Tooltip side="right" content="Redo">
              <span className="inline-flex">
                <IconCell mode="button" size="xl" chromeless label="Redo" onClick={onRedo}>
                  <Icon name="interface-essential-navigation-right-circle-1" large />
                </IconCell>
              </span>
            </Tooltip>
            <Tooltip side="right" content="Clear">
              <span className="inline-flex">
                <IconCell mode="button" size="xl" chromeless label="Clear" onClick={onClear}>
                  <Icon name="interface-essential-bin" large />
                </IconCell>
              </span>
            </Tooltip>
            <Tooltip side="right" content="Random">
              <span className="inline-flex">
                <IconCell mode="button" size="xl" chromeless label="Random" onClick={onRadnom}>
                  <Icon name="sparkles" large />
                </IconCell>
              </span>
            </Tooltip>
          </>
        )}
      </div>
    );
  }

  return (
    <ControlPanel
      density="compact"
      orientation={isHorizontal ? 'horizontal' : undefined}
      className={[
        'items-stretch !gap-px !bg-ink !p-0',
        isHorizontal ? '' : 'w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* STATUS — dimensions / active tool / brush color preview */}
      {showStatus && (
        <ScreenIsland className={islandClassName}>
          {statusReadout}
        </ScreenIsland>
      )}

      {/* CANVAS + HISTORY + GRID — 32x32 IconCells matching the tool rail */}
      {statusOnly ? null : (
        <ScreenIsland className={islandClassName}>
          <div className="flex flex-1 items-stretch gap-px" role="group" aria-label="Edit">
          <Tooltip side="top" content="Undo">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Undo" onClick={onUndo}>
                <Icon name="interface-essential-navigation-left-circle-1" large />
              </IconCell>
            </span>
          </Tooltip>
          <Tooltip side="top" content="Redo">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Redo" onClick={onRedo}>
                <Icon name="interface-essential-navigation-right-circle-1" large />
              </IconCell>
            </span>
          </Tooltip>
          <Tooltip side="top" content="Clear">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Clear" onClick={onClear}>
                <Icon name="interface-essential-bin" large />
              </IconCell>
            </span>
          </Tooltip>
          <Tooltip side="top" content="Random">
            <span className="inline-flex">
              <IconCell mode="button" size="xl" chromeless label="Random" onClick={onRadnom}>
                <Icon name="sparkles" large />
              </IconCell>
            </span>
          </Tooltip>
          </div>
        </ScreenIsland>
      )}
      {statusOnly ? null : (
        <ScreenIsland className={islandClassName}>
          <Tooltip side="top" content={isGridVisible ? 'Hide grid' : 'Show grid'}>
            <div className="flex h-10 items-center justify-between gap-1 bg-ctrl-cell-bg px-2">
              <span className="font-mono text-xs uppercase tracking-wider text-main">Grid</span>
              <Toggle
                value={isGridVisible}
                onChange={onGridToggle}
                size="sm"
              />
            </div>
          </Tooltip>
        </ScreenIsland>
      )}
    </ControlPanel>
  );
}
