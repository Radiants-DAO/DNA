// =============================================================================
// @rdna/ctrl — Control Surface Primitives
// =============================================================================

// Primitives
export { useDragControl } from './primitives/useDragControl';
export { useCanvasRenderer } from './primitives/useCanvasRenderer';
export type {
  ControlSize,
  ContinuousControlProps,
  DragAxis,
  DragControlConfig,
  DragControlReturn,
  CanvasRendererConfig,
  Point2D,
  ReadoutProps,
} from './primitives/types';

// Controls (continuous value)
export { Knob } from './controls/Knob/Knob';
export { Fader } from './controls/Fader/Fader';
export { CtrlSlider } from './controls/Slider/Slider';
export { XYPad } from './controls/XYPad/XYPad';
export { NumberScrubber } from './controls/NumberScrubber/NumberScrubber';
export { Ribbon } from './controls/Ribbon/Ribbon';
export { ArcRing } from './controls/ArcRing/ArcRing';

// Selectors (discrete selection)
export { SegmentedControl } from './selectors/SegmentedControl/SegmentedControl';
export { Stepper } from './selectors/Stepper/Stepper';
export { ButtonStrip } from './selectors/ButtonStrip/ButtonStrip';
export { Toggle } from './selectors/Toggle/Toggle';
export { ChipTag } from './selectors/ChipTag/ChipTag';
export { MatrixGrid } from './selectors/MatrixGrid/MatrixGrid';
export { RadialMenu } from './selectors/RadialMenu/RadialMenu';
export { ColorSwatch } from './selectors/ColorSwatch/ColorSwatch';

// Readouts (data display / feedback)
export { Meter } from './readouts/Meter/Meter';
export { LEDArray } from './readouts/LEDArray/LEDArray';
export { Sparkline } from './readouts/Sparkline/Sparkline';
export { Waveform } from './readouts/Waveform/Waveform';
export { Spectrum } from './readouts/Spectrum/Spectrum';

// Layout (panel composition)
export { Section } from './layout/Section/Section';
export { PropertyRow } from './layout/PropertyRow/PropertyRow';
export { ControlPanel, useDensity } from './layout/ControlPanel/ControlPanel';
export { PanelTitle } from './layout/PanelTitle/PanelTitle';
export { LayerTreeRow } from './layout/LayerTreeRow/LayerTreeRow';
