import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedControlMeta = defineComponentMeta<SegmentedControlProps>()({
  name: "SegmentedControl",
  description: "Row of mutually exclusive options with active highlight. Radio-group semantics.",
  props: {
    value: { type: "string", required: true, description: "Currently selected option value" },
    onChange: { type: "function", required: true, description: "Selection change callback" },
    options: { type: "array", required: true, description: "Array of {value, label, icon?}" },
    label: { type: "string", description: "Label text above the control" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Text/padding size preset" },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-track" },
    active: { background: "ctrl-fill", text: "ctrl-active" },
    inactive: { text: "ctrl-label" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic", code: '<SegmentedControl value="a" onChange={setVal} options={[{value:"a",label:"A"},{value:"b",label:"B"}]} />' },
  ],
  registry: {
    category: "form",
    tags: ["segment", "radio", "selector"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
