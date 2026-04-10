import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

export const CtrlSliderMeta = defineComponentMeta<ContinuousControlProps>()({
  name: "CtrlSlider",
  description: "Horizontal track slider with fill and thumb. Control-surface primitive using useDragControl.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the slider" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Width preset" },
    showValue: { type: "boolean", default: false, description: "Display value beside the label" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-track" },
    fill: { background: "ctrl-fill" },
    thumb: { background: "ctrl-thumb", border: "ctrl-fill" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "Basic slider", code: '<CtrlSlider value={50} onChange={setValue} />' },
    { name: "With label", code: '<CtrlSlider value={30} onChange={setValue} label="Pan" showValue />' },
  ],
  registry: {
    category: "form",
    tags: ["horizontal", "slider", "continuous"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
