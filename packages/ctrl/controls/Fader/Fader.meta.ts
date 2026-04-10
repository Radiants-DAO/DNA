import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

export const FaderMeta = defineComponentMeta<ContinuousControlProps>()({
  name: "Fader",
  description: "Vertical slider with track fill and positioned thumb. Drag vertically to adjust.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the fader" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Height preset" },
    showValue: { type: "boolean", default: false, description: "Display value below the fader" },
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
    { name: "Basic fader", code: '<Fader value={50} onChange={setValue} />' },
    { name: "With label", code: '<Fader value={80} onChange={setValue} label="Gain" showValue />' },
  ],
  registry: {
    category: "form",
    tags: ["vertical", "slider", "continuous"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
