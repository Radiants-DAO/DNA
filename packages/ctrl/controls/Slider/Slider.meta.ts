import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { SliderProps } from "./Slider";

export const CtrlSliderMeta = defineComponentMeta<SliderProps>()({
  name: "CtrlSlider",
  description:
    "Horizontal LCD-style slider. Position-driven (click-to-set, drag to scrub) with keyboard + ARIA slider semantics. Two variants: 'lcd' (default, skeuomorphic filament look) and 'line' (thin 1px volume line).",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the slider (also applied as aria-label)" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Width preset" },
    showValue: { type: "boolean", default: false, description: "Display value beside the label" },
    formatValue: { type: "function", description: "Custom value formatter" },
    variant: {
      type: "enum",
      values: ["lcd", "line"],
      default: "lcd",
      description: "Visual variant. 'lcd' renders end caps + tick stubs + 2×14 thumb; 'line' renders a thin groove with a glowing fill and no thumb.",
    },
    ticks: {
      type: "number",
      description: "Tick marks. Pass a count for evenly spaced ticks, or an array of positions in value-space (type: number | number[]). When omitted, the LCD variant draws its signature 3 interior stubs at 25/50/75%.",
    },
    snap: {
      type: "boolean",
      default: false,
      description: "Snap pointer + keyboard movement to the nearest tick. Requires ticks to have an effect.",
    },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-slider-track" },
    fill: { background: "ctrl-slider-fill", glow: "ctrl-slider-glow" },
    thumb: { background: "ctrl-slider-fill", glow: "ctrl-slider-glow" },
    endcap: { background: "ctrl-slider-endcap" },
    tick: { background: "ctrl-slider-tick" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "LCD slider (default)", code: '<CtrlSlider value={50} onChange={setValue} />' },
    { name: "With label + value", code: '<CtrlSlider value={30} onChange={setValue} label="Pan" showValue />' },
    { name: "Line variant (volume)", code: '<CtrlSlider value={75} onChange={setValue} variant="line" label="Volume" />' },
    { name: "Snap to 5 ticks", code: '<CtrlSlider value={v} onChange={setV} ticks={5} snap />' },
    { name: "Explicit tick positions", code: '<CtrlSlider value={v} onChange={setV} ticks={[0, 25, 50, 75, 100]} snap />' },
  ],
  registry: {
    category: "form",
    tags: ["horizontal", "slider", "continuous", "lcd"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
