// =============================================================================
// @rdna/ctrl — Shared Types
// =============================================================================

/** Drag axis for continuous controls */
export type DragAxis = 'x' | 'y' | 'radial' | '2d';

/** Size preset shared across all controls */
export type ControlSize = 'sm' | 'md' | 'lg';

/** 2D point value for XY controls */
export interface Point2D {
  x: number;
  y: number;
}

// =============================================================================
// Continuous control props (Knob, Fader, Slider, etc.)
// =============================================================================

export interface ContinuousControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

// =============================================================================
// Readout props (Meter, Sparkline, Waveform, etc.)
// =============================================================================

export interface ReadoutProps {
  value: number | number[];
  min?: number;
  max?: number;
  label?: string;
  size?: ControlSize;
  className?: string;
}

export interface MeterColorZones {
  low: number;
  mid: number;
}

/**
 * Semantic color options for the peak cap (topmost lit cell).
 * Each maps to an RDNA semantic token internally — callers never pass
 * raw CSS. To add a color, extend this union and the map in Meter.tsx.
 */
export type MeterPeakCapColor =
  | 'accent'
  | 'danger'
  | 'success'
  | 'info'
  | 'neutral'
  | 'none';

export type MeterProps = Omit<ReadoutProps, 'value'> & {
  value: number | [number, number];
  segments?: number;
  showValue?: boolean;
  orientation?: 'horizontal' | 'vertical';
  formatValue?: (v: number) => string;
  peakHold?: boolean;
  peakDecay?: number;
  showScale?: boolean;
  scaleMarks?: number[];
  channelLabels?: [string, string];
  colorZones?: MeterColorZones;
  /** When true, lit cells emit a yellow LED glow (paper LCD look). */
  glow?: boolean;
  /**
   * Semantic color for the topmost lit cell. Use `'none'` to disable the
   * peak-cap override and fall back to the zone color. Defaults to `'accent'`.
   */
  peakCapColor?: MeterPeakCapColor;
};

export interface XYPadProps {
  value: Point2D;
  onChange: (value: Point2D) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  showValue?: boolean;
  formatValue?: (v: Point2D) => string;
  className?: string;
}

// =============================================================================
// Drag control hook config
// =============================================================================

export type DragControlConfig =
  | {
      axis: 'x' | 'y' | 'radial';
      min: number;
      max: number;
      step?: number;
      sensitivity?: number;
      value: number;
      onChange: (value: number) => void;
      disabled?: boolean;
      inverted?: boolean;
    }
  | {
      axis: '2d';
      min: number;
      max: number;
      step?: number;
      sensitivity?: number;
      value: Point2D;
      onChange: (value: Point2D) => void;
      disabled?: boolean;
      inverted?: boolean;
    };

export interface DragControlReturn {
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    role: 'slider';
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-valuenow': number;
    'aria-orientation'?: 'horizontal' | 'vertical';
    tabIndex: 0;
  };
  isDragging: boolean;
  normalizedValue: number | Point2D;
}

// =============================================================================
// Canvas renderer hook config
// =============================================================================

export interface CanvasRendererConfig {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  /** Device pixel ratio override (defaults to window.devicePixelRatio) */
  dpr?: number;
}
