import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ButtonStripProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: Array<{ value: string; label?: string; icon?: React.ReactNode }>;
  mode?: 'radio' | 'multi';
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ButtonStripMeta = defineComponentMeta<ButtonStripProps>()({
  name: "ButtonStrip",
  description: "Row of icon/label buttons with radio or multi-select mode.",
  props: {
    value: { type: "string", required: true, description: "Selected value(s)" },
    onChange: { type: "function", required: true, description: "Selection change callback" },
    options: { type: "array", required: true, description: "Array of {value, label?, icon?}" },
    mode: { type: "enum", values: ["radio", "multi"], default: "radio", description: "Selection mode" },
    label: { type: "string", description: "Label text above the strip" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Button size preset" },
  },
  slots: {},
  tokenBindings: {
    track: { background: "ctrl-track" },
    active: { background: "ctrl-fill", text: "ctrl-active" },
    inactive: { text: "ctrl-label" },
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Radio mode", code: '<ButtonStrip value="1" onChange={setVal} options={[{value:"1",label:"A"},{value:"2",label:"B"}]} />' },
  ],
  registry: {
    category: "form",
    tags: ["button", "strip", "group"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
