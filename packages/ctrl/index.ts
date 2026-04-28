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
export { CtrlSlider, Slider } from './controls/Slider/Slider';
export type { SliderProps, SliderVariant } from './controls/Slider/Slider';
export { XYPad } from './controls/XYPad/XYPad';
export { NumberScrubber } from './controls/NumberScrubber/NumberScrubber';
export { NumberInput } from './controls/NumberInput/NumberInput';
export type { NumberInputProps } from './controls/NumberInput/NumberInput';
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
export { Dropdown } from './selectors/Dropdown/Dropdown';
export type { DropdownOption, DropdownProps } from './selectors/Dropdown/Dropdown';
export { AlignmentGrid } from './selectors/AlignmentGrid/AlignmentGrid';
export type { AlignmentPosition, AlignmentGridProps } from './selectors/AlignmentGrid/AlignmentGrid';
export { DirectionPad } from './selectors/DirectionPad/DirectionPad';
export type { Direction, DirectionPadProps } from './selectors/DirectionPad/DirectionPad';

// Readouts (data display / feedback)
export { Meter } from './readouts/Meter/Meter';
export { LEDArray } from './readouts/LEDArray/LEDArray';
export { LEDProgress } from './readouts/LEDProgress/LEDProgress';
export type { LEDProgressProps } from './readouts/LEDProgress/LEDProgress';
export { Sparkline } from './readouts/Sparkline/Sparkline';
export { Waveform } from './readouts/Waveform/Waveform';
export { Spectrum } from './readouts/Spectrum/Spectrum';
export { Tooltip, TooltipProvider } from './readouts/Tooltip/Tooltip';
export type { TooltipProps } from './readouts/Tooltip/Tooltip';

// Layout (panel composition)
export { Section } from './layout/Section/Section';
export { PropertyRow } from './layout/PropertyRow/PropertyRow';
export { ControlPanel, useDensity } from './layout/ControlPanel/ControlPanel';
export { PanelTitle } from './layout/PanelTitle/PanelTitle';
export { LayerTreeRow } from './layout/LayerTreeRow/LayerTreeRow';
export { LayerRow } from './layout/LayerRow/LayerRow';
export { ActionButton } from './layout/ActionButton/ActionButton';
export { RegistryRow } from './layout/RegistryRow/RegistryRow';
export { IconCell } from './selectors/IconCell/IconCell';
export { LCDScreen } from './layout/LCDScreen/LCDScreen';
export { TransportPill } from './selectors/TransportPill/TransportPill';
export { TransportButton } from './selectors/TransportButton/TransportButton';
export type { TransportButtonProps } from './selectors/TransportButton/TransportButton';
