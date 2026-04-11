import { BrushTool } from '@/lib/dotting';

export interface PaletteColor {
  name: string;
  hex: string;
}

export const PALETTE_COLORS: PaletteColor[] = [
  { name: 'Ink', hex: '#0f0e0c' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Cream', hex: '#fef8e2' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Sun Yellow', hex: '#fce184' },
  { name: 'Sunset Fuzz', hex: '#fcc383' },
  { name: 'Sun Red', hex: '#ff7f7f' },
  { name: 'Mint', hex: '#cef5ca' },
  { name: 'Sky Blue', hex: '#95bad2' },
  { name: 'Sky Blue Dark', hex: '#276182' },
];

export interface ToolDef {
  tool: BrushTool;
  label: string;
  icon: string;
  large?: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
  { tool: BrushTool.DOT, label: 'Pen', icon: 'pencil' },
  { tool: BrushTool.ERASER, label: 'Eraser', icon: 'interface-essential-eraser', large: true },
  { tool: BrushTool.PAINT_BUCKET, label: 'Fill', icon: 'design-color-bucket', large: true },
  { tool: BrushTool.LINE, label: 'Line', icon: 'minus' },
  { tool: BrushTool.RECTANGLE, label: 'Rect', icon: 'outline-box' },
  { tool: BrushTool.RECTANGLE_FILLED, label: 'Fill Rect', icon: 'stop-playback' },
  { tool: BrushTool.ELLIPSE, label: 'Ellipse', icon: 'interface-essential-alert-circle-1', large: true },
  { tool: BrushTool.ELLIPSE_FILLED, label: 'Fill Ellipse', icon: 'record-playback' },
  { tool: BrushTool.SELECT, label: 'Select', icon: 'interface-essential-cursor-select', large: true },
  { tool: BrushTool.NONE, label: 'Pan', icon: 'hand-point' },
];

export const DEFAULT_BRUSH_COLOR = '#0f0e0c';
export const CANVAS_BG_COLOR = '#fef8e2';
