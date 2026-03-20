import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleProps {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: string;
  disabled?: boolean;
  size?: string;
  variant?: string;
  value?: string;
  children?: string;
}

export const ToggleMeta = defineComponentMeta<ToggleProps>()({
  name: "Toggle",
  description:
    "Pressable toggle button that holds a pressed/unpressed state. Used as standalone or inside ToggleGroup.",
  props: {
    pressed: {
      type: "boolean",
      description: "Controlled pressed state",
    },
    defaultPressed: {
      type: "boolean",
      description: "Initial pressed state for uncontrolled usage",
    },
    onPressedChange: {
      type: "string",
      description: "Callback when pressed state changes",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable toggle interactions",
    },
    size: {
      type: "string",
      description: "Size variant: sm, md, lg",
    },
    variant: {
      type: "string",
      description: "Visual variant",
    },
    value: {
      type: "string",
      description: "Value when used inside ToggleGroup",
    },
    children: {
      type: "string",
      description: "Toggle content",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic toggle",
      code: "<Toggle>Bold</Toggle>",
    },
    {
      name: "Pressed state",
      code: "<Toggle defaultPressed>Italic</Toggle>",
    },
    {
      name: "Disabled",
      code: "<Toggle disabled>Underline</Toggle>",
    },
  ],
  registry: {
    category: "action",
    tags: ["toggle", "press", "on-off"],
    renderMode: "inline",
    exampleProps: { children: "Toggle" },
    states: ["hover", "pressed", "focus", "disabled"],
  },
});
