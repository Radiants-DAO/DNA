'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  CELL_W,
  CELL_H,
  FONT_SIZE,
  isBoxChar,
  applyOverlay,
  computeBoxScratch,
  computeLineScratch,
  type AsciiComponent,
  type ToolMode,
} from './types';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface Props {
  grid: string[][];
  cols: number;
  rows: number;
  tool: ToolMode;
  drawChar: string;
  selectedComponent: AsciiComponent | null;
  onGridChange: (newGrid: string[][]) => void;
  onComponentPlaced: () => void;
}

interface Cell {
  r: number;
  c: number;
}

// ─────────────────────────────────────────────────
// Canvas
// ─────────────────────────────────────────────────

export function WireframeCanvas({
  grid,
  cols,
  rows,
  tool,
  drawChar,
  selectedComponent,
  onGridChange,
  onComponentPlaced,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<Cell | null>(null);
  const [scratch, setScratch] = useState<(string | null)[][] | null>(null);

  // ── Display grid ──────────────────────────────────

  const displayGrid = useMemo(
    () => (scratch ? applyOverlay(grid, scratch) : grid),
    [grid, scratch]
  );

  // ── Component stamp preview cells ─────────────────

  const previewCells = useMemo(() => {
    if (tool !== 'stamp' || !selectedComponent || !hoverCell) return new Set<string>();
    const cells = new Set<string>();
    for (let lr = 0; lr < selectedComponent.lines.length; lr++) {
      const line = selectedComponent.lines[lr];
      for (let lc = 0; lc < line.length; lc++) {
        if (line[lc] !== ' ') {
          const tr = hoverCell.r + lr;
          const tc = hoverCell.c + lc;
          if (tr < rows && tc < cols) cells.add(`${tr},${tc}`);
        }
      }
    }
    return cells;
  }, [tool, selectedComponent, hoverCell, rows, cols]);

  // ── Active scratch cells set ───────────────────────

  const scratchCells = useMemo(() => {
    if (!scratch) return new Set<string>();
    const cells = new Set<string>();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (scratch[r]?.[c] !== null && scratch[r]?.[c] !== undefined) {
          cells.add(`${r},${c}`);
        }
      }
    }
    return cells;
  }, [scratch, rows, cols]);

  // ── Cell coordinate from mouse event ──────────────

  const cellFromEvent = useCallback(
    (e: React.MouseEvent): Cell | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left + el.scrollLeft;
      const y = e.clientY - rect.top + el.scrollTop;
      const c = Math.floor(x / CELL_W);
      const r = Math.floor(y / CELL_H);
      if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
      return { r, c };
    },
    [rows, cols]
  );

  // ── Mouse handlers ────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const cell = cellFromEvent(e);
      if (!cell) return;

      // Stamp: place immediately on click
      if (tool === 'stamp' && selectedComponent) {
        const newGrid = grid.map((row) => [...row]);
        for (let lr = 0; lr < selectedComponent.lines.length; lr++) {
          const line = selectedComponent.lines[lr];
          for (let lc = 0; lc < line.length; lc++) {
            const tr = cell.r + lr;
            const tc = cell.c + lc;
            if (tr < rows && tc < cols && line[lc] !== ' ') {
              newGrid[tr][tc] = line[lc];
            }
          }
        }
        onGridChange(newGrid);
        onComponentPlaced();
        return;
      }

      setIsDrawing(true);
      setDragStart(cell);

      if (tool === 'pencil' || tool === 'erase') {
        const init: (string | null)[][] = Array.from({ length: rows }, () =>
          Array<string | null>(cols).fill(null)
        );
        init[cell.r][cell.c] = tool === 'erase' ? ' ' : drawChar;
        setScratch(init);
      }
    },
    [cellFromEvent, tool, selectedComponent, grid, rows, cols, drawChar, onGridChange, onComponentPlaced]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cell = cellFromEvent(e);
      setHoverCell(cell);

      if (!isDrawing || !dragStart || !cell) return;

      if (tool === 'box') {
        setScratch(computeBoxScratch(cols, rows, dragStart.r, dragStart.c, cell.r, cell.c));
      } else if (tool === 'line') {
        setScratch(computeLineScratch(cols, rows, dragStart.r, dragStart.c, cell.r, cell.c));
      } else if (tool === 'pencil' || tool === 'erase') {
        const ch = tool === 'erase' ? ' ' : drawChar;
        setScratch((prev) => {
          const next = prev
            ? prev.map((row) => [...row])
            : Array.from({ length: rows }, () => Array<string | null>(cols).fill(null));
          if (cell.r < rows && cell.c < cols) next[cell.r][cell.c] = ch;
          return next;
        });
      }
    },
    [cellFromEvent, isDrawing, dragStart, tool, cols, rows, drawChar]
  );

  // Commit on mouseup (global so release outside canvas still commits)
  useEffect(() => {
    function handleMouseUp() {
      if (!isDrawing) return;
      setIsDrawing(false);
      if (scratch) {
        onGridChange(applyOverlay(grid, scratch));
        setScratch(null);
      }
      setDragStart(null);
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, scratch, grid]);

  // ── Cursor style ──────────────────────────────────

  const cursor =
    tool === 'stamp'
      ? 'crosshair'
      : tool === 'pencil'
        ? 'cell'
        : tool === 'erase'
          ? 'cell'
          : 'crosshair';

  // ── Render ────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverCell(null)}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        cursor,
        backgroundColor: 'var(--color-page)',
        userSelect: 'none',
      }}
    >
      {/* Inner canvas — sized exactly to the grid */}
      <div
        style={{
          width: cols * CELL_W,
          height: rows * CELL_H,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {displayGrid.map((row, r) => (
          <div key={r} style={{ display: 'flex', height: CELL_H, flexShrink: 0 }}>
            {row.map((ch, c) => {
              const key = `${r},${c}`;
              const isHover = hoverCell?.r === r && hoverCell?.c === c;
              const isScratch = scratchCells.has(key);
              const isPreview = previewCells.has(key);

              let bgColor = 'transparent';
              let color = 'var(--color-main)';

              if (isPreview) {
                bgColor = 'color-mix(in oklch, var(--color-accent) 22%, transparent)';
                color = 'var(--color-accent)';
              } else if (isScratch) {
                bgColor = 'color-mix(in oklch, var(--color-accent) 18%, transparent)';
                color = isBoxChar(ch) ? 'var(--color-accent)' : 'var(--color-main)';
              } else if (isHover) {
                bgColor = 'color-mix(in oklch, var(--color-line) 35%, transparent)';
              } else if (ch !== ' ' && isBoxChar(ch)) {
                color = 'var(--color-accent)';
              }

              return (
                <span
                  key={c}
                  style={{
                    display: 'inline-block',
                    width: CELL_W,
                    height: CELL_H,
                    lineHeight: `${CELL_H}px`,
                    fontSize: FONT_SIZE,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    backgroundColor: bgColor,
                    color,
                    textAlign: 'center',
                    whiteSpace: 'pre',
                    flexShrink: 0,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
