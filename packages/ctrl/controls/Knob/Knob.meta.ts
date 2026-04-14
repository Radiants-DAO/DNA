import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

export const KnobMeta = defineComponentMeta<ContinuousControlProps>()({
  name: "Knob",
  description: "SVG rotary control with 270° arc indicator and needle. Drag vertically to adjust value.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the knob" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Knob diameter preset" },
    showValue: { type: "boolean", default: false, description: "Display value below the knob" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    track: { stroke: "ctrl-track" },
    fill: { stroke: "ctrl-fill" },
    needle: { stroke: "ctrl-thumb" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "Basic knob", code: '<Knob value={50} onChange={setValue} />' },
    { name: "With label", code: '<Knob value={75} onChange={setValue} label="Volume" showValue />' },
  ],
  registry: {
    category: "form",
    tags: ["rotary", "dial", "continuous"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
