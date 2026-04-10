import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

export const NumberScrubberMeta = defineComponentMeta<ContinuousControlProps>()({
  name: "NumberScrubber",
  description: "Inline drag-to-adjust numeric display. Drag horizontally to change value.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 1, description: "Step increment" },
    label: { type: "string", description: "Label text before the value" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Font size preset" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
    hover: { background: "ctrl-hover/10" },
  },
  examples: [
    { name: "Basic scrubber", code: '<NumberScrubber value={42} onChange={setValue} />' },
    { name: "With label", code: '<NumberScrubber value={16} onChange={setValue} label="Size" />' },
  ],
  registry: {
    category: "form",
    tags: ["inline", "number", "scrub"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
