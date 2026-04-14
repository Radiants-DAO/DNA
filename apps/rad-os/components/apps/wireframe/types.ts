// ─────────────────────────────────────────────────
// Wireframe app — shared types & grid utilities
// ─────────────────────────────────────────────────

export type ToolMode = 'box' | 'line' | 'pencil' | 'erase' | 'stamp';

export interface AsciiComponent {
  id: string;
  name: string;
  category: string;
  lines: string[];
  width: number;
  height: number;
}

// ── Canvas constants ──────────────────────────────

export const CELL_W = 9;
export const CELL_H = 18;
export const FONT_SIZE = 12;

export const DRAW_CHARS = ['#', '·', '*', '+', 'x', '~', '░', '▓', '-', '='];

export const CANVAS_PRESETS = [
  { cols: 80, rows: 24, label: 'Terminal (80×24)' },
  { cols: 100, rows: 32, label: 'Wide (100×32)' },
  { cols: 60, rows: 20, label: 'Small (60×20)' },
] as const;

export type CanvasPreset = (typeof CANVAS_PRESETS)[number];

export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 24;

// ── Grid utilities ────────────────────────────────

export function createEmpty(cols: number, rows: number): string[][] {
  return Array.from({ length: rows }, () => Array<string>(cols).fill(' '));
}

export function gridToText(grid: string[][]): string {
  return grid
    .map((row) => row.join('').replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

/** Merge a scratch overlay into a base grid (null = no change). */
export function applyOverlay(
  base: string[][],
  overlay: (string | null)[][]
): string[][] {
  return base.map((row, r) =>
    row.map((ch, c) => {
      const o = overlay[r]?.[c];
      return o !== null && o !== undefined ? o : ch;
    })
  );
}

// ── Box-drawing helpers ───────────────────────────

export const BOX_DRAWING = new Set('┌┐└┘─│├┤┬┴┼╔╗╚╝║═╠╣╦╩╬◄►▲▼');

export function isBoxChar(ch: string): boolean {
  return BOX_DRAWING.has(ch);
}

// ── Scratch layer generators ──────────────────────

/** Compute scratch overlay for a rectangle drag. */
export function computeBoxScratch(
  cols: number,
  rows: number,
  startR: number,
  startC: number,
  endR: number,
  endC: number
): (string | null)[][] {
  const scratch: (string | null)[][] = Array.from({ length: rows }, () =>
    Array<string | null>(cols).fill(null)
  );

  const top = Math.min(startR, endR);
  const bottom = Math.max(startR, endR);
  const left = Math.min(startC, endC);
  const right = Math.max(startC, endC);

  if (top === bottom && left === right) return scratch;

  if (top === bottom) {
    for (let c = left; c <= right; c++) scratch[top][c] = '─';
    return scratch;
  }

  if (left === right) {
    for (let r = top; r <= bottom; r++) scratch[r][left] = '│';
    return scratch;
  }

  // Edges
  for (let c = left + 1; c < right; c++) {
    if (top < rows) scratch[top][c] = '─';
    if (bottom < rows) scratch[bottom][c] = '─';
  }
  for (let r = top + 1; r < bottom; r++) {
    if (left < cols) scratch[r][left] = '│';
    if (right < cols) scratch[r][right] = '│';
  }

  // Corners
  scratch[top][left] = '┌';
  scratch[top][right] = '┐';
  scratch[bottom][left] = '└';
  scratch[bottom][right] = '┘';

  return scratch;
}

/** Compute scratch overlay for a line drag (horizontal or vertical). */
export function computeLineScratch(
  cols: number,
  rows: number,
  startR: number,
  startC: number,
  endR: number,
  endC: number
): (string | null)[][] {
  const scratch: (string | null)[][] = Array.from({ length: rows }, () =>
    Array<string | null>(cols).fill(null)
  );

  const dr = Math.abs(endR - startR);
  const dc = Math.abs(endC - startC);

  if (dr >= dc) {
    // Vertical
    const [top, bottom] =
      startR <= endR ? [startR, endR] : [endR, startR];
    for (let r = top; r <= bottom; r++) {
      if (r < rows && startC < cols) scratch[r][startC] = '│';
    }
  } else {
    // Horizontal
    const [l, r2] = startC <= endC ? [startC, endC] : [endC, startC];
    for (let c = l; c <= r2; c++) {
      if (startR < rows && c < cols) scratch[startR][c] = '─';
    }
  }

  return scratch;
}
