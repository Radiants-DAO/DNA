import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface NumberFieldProps {
  defaultValue?: number;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const NumberFieldMeta = defineComponentMeta<NumberFieldProps>()({
  name: "NumberField",
  description:
    "Numeric input with increment/decrement buttons and optional scrub-to-adjust. Wraps Base UI NumberField for accessible numeric entry.",
  subcomponents: [
    "NumberField.Root",
    "NumberField.Input",
    "NumberField.Increment",
    "NumberField.Decrement",
    "NumberField.Group",
    "NumberField.ScrubArea",
    "NumberField.ScrubAreaCursor",
  ],
  props: {
    defaultValue: { type: "number", description: "Initial value for uncontrolled usage" },
    value: { type: "number", description: "Controlled value" },
    min: { type: "number", description: "Minimum allowed value" },
    max: { type: "number", description: "Maximum allowed value" },
    step: { type: "number", default: 1, description: "Step increment for increment/decrement" },
    disabled: { type: "boolean", default: false, description: "Whether the number field is disabled" },
  },
  slots: {
    Input: { description: "The numeric input element" },
    Increment: { description: "Button to increase the value by step" },
    Decrement: { description: "Button to decrease the value by step" },
    Group: { description: "Container grouping decrement, input, and increment" },
    ScrubArea: { description: "Drag-to-adjust area for fine value control" },
  },
  tokenBindings: {
    default: {
      background: "page",
      text: "main",
      border: "line",
      placeholder: "mute",
      focusRing: "focus",
      buttonBackground: "inv",
      buttonHover: "tinted",
    },
    disabled: { opacity: "0.5" },
  },
  examples: [
    {
      name: "Basic number field",
      code: "<NumberField.Root defaultValue={0}>\n  <NumberField.Group>\n    <NumberField.Decrement />\n    <NumberField.Input />\n    <NumberField.Increment />\n  </NumberField.Group>\n</NumberField.Root>",
    },
    {
      name: "Number field with min/max",
      code: "<NumberField.Root defaultValue={5} min={0} max={10} step={1}>\n  <NumberField.Group>\n    <NumberField.Decrement />\n    <NumberField.Input />\n    <NumberField.Increment />\n  </NumberField.Group>\n</NumberField.Root>",
    },
    {
      name: "Disabled number field",
      code: "<NumberField.Root defaultValue={42} disabled>\n  <NumberField.Group>\n    <NumberField.Decrement />\n    <NumberField.Input />\n    <NumberField.Increment />\n  </NumberField.Group>\n</NumberField.Root>",
    },
  ],
  registry: {
    category: "form",
    tags: ["number", "input", "stepper", "numeric"],
    renderMode: "custom",
    states: [
      { name: "focus", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/NumberField",
    propSchema: {},
    slashMenu: {
      title: "NumberField",
      subtext: "Numeric input with increment/decrement buttons and...",
      aliases: ["numberfield","number","input","stepper"],
      icon: "plus",
    },
  },

});
