import { BrushTool } from '@/lib/dotting';

export interface PaletteColor {
  name: string;
  hex: string;
}

export const PALETTE_COLORS: PaletteColor[] = [
  { name: 'Ink', hex: '#0f0e0c' },
  { name: 'Cream', hex: '#fef8e2' },
  { name: 'Sun Yellow', hex: '#fce184' },
  { name: 'Transparent', hex: 'transparent' },
];

export interface ToolShortcut {
  /** Case-insensitive `KeyboardEvent.key` (e.g. 'b', 'r'). */
  key: string;
  /** Requires Shift modifier. */
  shift?: boolean;
  /** Display in tooltips, e.g. 'B' or '⇧R'. */
  display: string;
}

export interface ToolDef {
  tool: BrushTool;
  label: string;
  icon: string;
  large?: boolean;
  shortcut?: ToolShortcut;
}

export const TOOL_DEFS: ToolDef[] = [
  { tool: BrushTool.DOT, label: 'Pen', icon: 'design-pencil', large: true, shortcut: { key: 'b', display: 'B' } },
  { tool: BrushTool.ERASER, label: 'Eraser', icon: 'interface-essential-eraser', large: true, shortcut: { key: 'e', display: 'E' } },
  { tool: BrushTool.PAINT_BUCKET, label: 'Fill', icon: 'design-color-bucket', large: true, shortcut: { key: 'g', display: 'G' } },
  { tool: BrushTool.LINE, label: 'Line', icon: 'design-ruler', large: true, shortcut: { key: 'l', display: 'L' } },
  { tool: BrushTool.RECTANGLE, label: 'Rect', icon: 'video-movies-square-off', large: true, shortcut: { key: 'r', display: 'R' } },
  { tool: BrushTool.RECTANGLE_FILLED, label: 'Fill Rect', icon: 'video-movies-video-square', large: true, shortcut: { key: 'r', shift: true, display: '⇧R' } },
  { tool: BrushTool.ELLIPSE, label: 'Ellipse', icon: 'interface-essential-alert-circle-1', large: true, shortcut: { key: 'o', display: 'O' } },
  { tool: BrushTool.ELLIPSE_FILLED, label: 'Fill Ellipse', icon: 'interface-essential-alert-circle-2', large: true, shortcut: { key: 'o', shift: true, display: '⇧O' } },
  { tool: BrushTool.SELECT, label: 'Select', icon: 'interface-essential-cursor-select', large: true, shortcut: { key: 'v', display: 'V' } },
];

export const DEFAULT_BRUSH_COLOR = '#0f0e0c';
export const CANVAS_BG_COLOR = '#fef8e2';
/** Fixed canvas dimensions. Studio is locked to 32×32 for phase 1. */
export const CANVAS_SIZE = 32;
