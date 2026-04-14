import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const ToggleMeta = defineComponentMeta<ToggleProps>()({
  name: "Toggle",
  description: "LED lamp/latch toggle with on/off state. Distinct from core Toggle button variant.",
  props: {
    value: { type: "boolean", required: true, description: "On/off state" },
    onChange: { type: "function", required: true, description: "State change callback" },
    label: { type: "string", description: "Label text next to LED" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "LED size preset" },
    color: { type: "string", description: "Custom LED color (CSS value)" },
  },
  slots: {},
  tokenBindings: {
    led: { on: "ctrl-fill", off: "ctrl-track", glow: "ctrl-glow" },
    label: { on: "ctrl-value", off: "ctrl-label" },
  },
  examples: [
    { name: "Basic toggle", code: '<Toggle value={true} onChange={setVal} label="Enabled" />' },
  ],
  registry: {
    category: "form",
    tags: ["toggle", "led", "switch", "lamp"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
