import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  label?: string;
  labelPosition?: "left" | "right";
  id?: string;
}

export const SwitchMeta = defineComponentMeta<SwitchProps>()({
  name: "Switch",
  description:
    "On/off toggle control for binary settings. Provides accessible switch interaction with customizable sizes and optional label.",
  props: {
    checked: { type: "boolean", required: true, description: "Controlled checked state of the switch" },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset controlling track and thumb dimensions",
    },
    disabled: { type: "boolean", default: false, description: "Disable switch interactions" },
    label: { type: "string", description: "Optional label text for the switch" },
    labelPosition: {
      type: "enum",
      values: ["left", "right"],
      default: "right",
      description: "Position of label relative to switch",
    },
    id: { type: "string", description: "ID for accessibility linking between label and switch" },
  },
  slots: {},
  tokenBindings: {
    track: {
      border: "line",
      backgroundOff: "line/10",
      backgroundOn: "accent",
      focusRing: "focus",
    },
    thumb: { background: "inv", border: "line" },
    label: { text: "main", font: "mondwest" },
  },
  examples: [
    { name: "Basic switch", code: "<Switch checked={enabled} onChange={setEnabled} />" },
    {
      name: "With label",
      code: '<Switch checked={enabled} onChange={setEnabled} label="Enable notifications" />',
    },
    {
      name: "Disabled state",
      code: '<Switch checked={true} onChange={() => {}} disabled label="Locked setting" />',
    },
  ],
  registry: {
    category: "form",
    tags: ["toggle", "on-off", "boolean"],
    renderMode: "custom",
    controlledProps: ["checked", "onChange"],
    states: ["focus", "disabled"],
  },
});
