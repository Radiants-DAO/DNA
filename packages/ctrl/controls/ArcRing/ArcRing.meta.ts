import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

export const ArcRingMeta = defineComponentMeta<ContinuousControlProps>()({
  name: "ArcRing",
  description: "Circular progress arc with thick stroke and centered value display. Read-heavy variant of Knob.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the arc" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Arc diameter preset" },
    showValue: { type: "boolean", default: true, description: "Display value centered inside the arc" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    track: { stroke: "ctrl-track" },
    fill: { stroke: "ctrl-fill" },
    value: { fill: "ctrl-value" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic arc", code: '<ArcRing value={75} onChange={setValue} />' },
    { name: "With label", code: '<ArcRing value={60} onChange={setValue} label="CPU" />' },
  ],
  registry: {
    category: "control",
    tags: ["arc", "ring", "progress", "continuous"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
