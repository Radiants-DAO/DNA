import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  name?: string;
  value?: string;
}

export const CheckboxMeta = defineComponentMeta<CheckboxProps>()({
  name: "Checkbox",
  description:
    "Retro-styled checkbox and radio components for form selections. Provides accessible input controls with visual feedback states.",
  subcomponents: ["Checkbox", "Radio"],
  props: {
    label: { type: "string", description: "Label text displayed next to the input" },
    disabled: { type: "boolean", default: false, description: "Disable input interactions" },
    checked: { type: "boolean", description: "Controlled checked state (native HTML attribute)" },
    defaultChecked: { type: "boolean", description: "Initial checked state for uncontrolled usage" },
    name: { type: "string", description: "Input name for form submission" },
    value: { type: "string", description: "Input value for form submission" },
  },
  slots: {},
  tokenBindings: {
    container: { gap: "spacing-xs" },
    input: {
      background: "page",
      border: "line",
      backgroundChecked: "accent",
      focusRing: "focus",
    },
    checkmark: { color: "main" },
    radioDot: { background: "main" },
    label: { text: "main", font: "mondwest" },
  },
  examples: [
    { name: "Basic checkbox", code: '<Checkbox label="Accept terms" />' },
    { name: "Checked checkbox", code: '<Checkbox label="Subscribe to newsletter" defaultChecked />' },
    { name: "Disabled checkbox", code: '<Checkbox label="Locked option" disabled />' },
  ],
  registry: {
    category: "form",
    tags: ["toggle", "check", "boolean"],
    renderMode: "inline",
    exampleProps: { label: "Accept terms" },
    states: [
      { name: "hover", driver: "wrapper" },
      { name: "focus", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: {},
    slashMenu: {
      title: "Checkbox",
      subtext: "Retro-styled checkbox and radio components for for...",
      aliases: ["checkbox","toggle","check","boolean"],
      icon: "checkmark",
    },
  },

});
