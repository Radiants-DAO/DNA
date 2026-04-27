'use client';

// =============================================================================
// StudioLeftRail — Narrow left-side dock for the Studio editor.
//
// Hosts the Tool palette as a single-column vertical stack of IconCells.
// Brush colors live in their own left-side slot; layers + export stay right.
// =============================================================================

import { type ReactNode } from 'react';
import { IconCell, Tooltip } from '@rdna/ctrl';
import { Icon } from '@rdna/radiants/icons/runtime';
import { type BrushTool } from '@/lib/dotting';
import { type ToolDef } from './constants';

export interface StudioLeftRailProps {
  tools: ReadonlyArray<ToolDef>;
  activeTool: BrushTool;
  onToolChange: (tool: BrushTool) => void;

  /** Trailing cell rendered as the last item in the tool grid (e.g. the
   *  active-color swatch). Sized to match a tool cell. */
  trailing?: ReactNode;
  /** Optional header node rendered at the top of the grid spanning all
   *  columns (e.g. the active-tool readout). */
  header?: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function StudioLeftRail({
  tools,
  activeTool,
  onToolChange,
  trailing,
  header,
  columns = 1,
  className = '',
}: StudioLeftRailProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tool"
      className={[
        columns === 2 ? 'grid-cols-[40px_40px]' : 'grid-cols-[40px]',
        'grid gap-px bg-ink pl-px pr-[2px] py-px',
        className,
      ].filter(Boolean).join(' ')}
    >
      {header && (
        <div className={columns === 2 ? 'col-span-2' : ''}>{header}</div>
      )}
      {tools.map((def) => (
        <Tooltip
          key={def.tool}
          side="right"
          content={def.shortcut ? `${def.label} (${def.shortcut.display})` : def.label}
        >
          <span className="inline-flex">
            <IconCell
              mode="radio"
              size="xl"
              chromeless
              selected={def.tool === activeTool}
              label={def.label}
              onClick={() => onToolChange(def.tool)}
            >
              {def.large ? <Icon name={def.icon} large /> : <Icon name={def.icon} />}
            </IconCell>
          </span>
        </Tooltip>
      ))}
      {trailing && (
        <span className="inline-flex h-10 w-10 items-center justify-center bg-ctrl-cell-bg">
          {trailing}
        </span>
      )}
    </div>
  );
}
