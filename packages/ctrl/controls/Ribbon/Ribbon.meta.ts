import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ContinuousControlProps } from "../../primitives/types";

interface RibbonProps extends ContinuousControlProps {
  springReturn?: boolean;
}

export const RibbonMeta = defineComponentMeta<RibbonProps>()({
  name: "Ribbon",
  description: "Continuous strip with absolute position mapping. Touch position = value. Optional spring-return to center.",
  props: {
    value: { type: "number", required: true, description: "Current numeric value" },
    onChange: { type: "function", required: true, description: "Value change callback" },
    min: { type: "number", default: 0, description: "Minimum value" },
    max: { type: "number", default: 100, description: "Maximum value" },
    step: { type: "number", default: 0, description: "Step increment (0 = continuous)" },
    label: { type: "string", description: "Label text above the ribbon" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Width preset" },
    showValue: { type: "boolean", default: false, description: "Display value beside the label" },
    springReturn: { type: "boolean", default: false, description: "Snap to center on release" },
    formatValue: { type: "function", description: "Custom value formatter" },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-track" },
    indicator: { background: "ctrl-fill" },
    label: { text: "ctrl-label" },
    value: { text: "ctrl-value" },
  },
  examples: [
    { name: "Basic ribbon", code: '<Ribbon value={50} onChange={setValue} />' },
    { name: "Spring return", code: '<Ribbon value={50} onChange={setValue} springReturn label="Pitch Bend" />' },
  ],
  registry: {
    category: "control",
    tags: ["strip", "ribbon", "position"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
