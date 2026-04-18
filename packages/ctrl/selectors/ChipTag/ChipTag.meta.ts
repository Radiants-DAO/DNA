import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ControlSize } from "../../primitives/types";

export interface ChipTagProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: string[];
  mode?: 'single' | 'multi';
  label?: string;
  disabled?: boolean;
  size?: ControlSize;
  className?: string;
}

export const ChipTagMeta = defineComponentMeta<ChipTagProps>()({
  name: "ChipTag",
  description: "Selectable pill labels for filtering or tagging. Single or multi-select.",
  props: {
    value: { type: "string", required: true, description: "Selected value(s)" },
    onChange: { type: "function", required: true, description: "Selection change callback" },
    options: { type: "array", required: true, description: "Array of string labels" },
    mode: { type: "enum", values: ["single", "multi"], default: "single", description: "Selection mode" },
    label: { type: "string", description: "Label text above the chips" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Chip size preset" },
  },
  slots: {},
  tokenBindings: {
    chipActive: { background: "ctrl-fill", text: "ctrl-active" },
    chipInactive: { background: "ctrl-track", text: "ctrl-label" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Single select", code: '<ChipTag value="A" onChange={setVal} options={["A","B","C"]} />' },
    { name: "Multi select", code: '<ChipTag value={["A","C"]} onChange={setVal} options={["A","B","C"]} mode="multi" />' },
  ],
  registry: {
    category: "form",
    tags: ["chip", "tag", "pill", "filter"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
