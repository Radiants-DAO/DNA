import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleProps {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: string;
  disabled?: boolean;
  mode?: "solid" | "flat" | "pattern";
  tone?: "accent" | "danger" | "success" | "neutral" | "cream" | "white" | "info" | "tinted";
  size?: "sm" | "md" | "lg";
  rounded?: "xs" | "sm" | "md" | "lg" | "xl" | "none";
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
    mode: {
      type: "enum",
      options: ["solid", "flat", "pattern"],
      default: "solid",
      description: "Visual mode — controls fill treatment",
    },
    tone: {
      type: "enum",
      options: ["accent", "danger", "success", "neutral", "cream", "white", "info", "tinted"],
      default: "accent",
      description: "Color tone",
    },
    size: {
      type: "enum",
      options: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset",
    },
    rounded: {
      type: "enum",
      options: ["xs", "sm", "md", "lg", "xl", "none"],
      default: "xs",
      description: "Pixel-corner roundness",
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
