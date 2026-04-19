import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToggleProps {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: string;
  value?: string;
  tone?: "accent" | "danger" | "success" | "neutral" | "cream" | "white" | "info" | "tinted";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "none";
  icon?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  children?: string;
}

export const ToggleMeta = defineComponentMeta<ToggleProps>()({
  name: "Toggle",
  description:
    "Pressable chip-style toggle that holds a pressed/unpressed state. Used standalone or inside ToggleGroup.",
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
    value: {
      type: "string",
      description: "Value when used inside ToggleGroup",
    },
    tone: {
      type: "enum",
      options: ["accent", "danger", "success", "neutral", "cream", "white", "info", "tinted"],
      default: "neutral",
      description: "Color tone",
    },
    size: {
      type: "enum",
      options: ["xs", "sm", "md", "lg"],
      default: "xs",
      description: "Size preset",
    },
    rounded: {
      type: "enum",
      options: ["xs", "sm", "md", "lg", "xl", "full", "none"],
      default: "xs",
      description: "Pixel-corner roundness",
    },
    icon: {
      type: "string",
      description: "RDNA icon name",
    },
    iconOnly: {
      type: "boolean",
      default: false,
      description: "Square button showing only the icon",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable toggle interactions",
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
  wraps: "@base-ui/react/toggle",
  a11y: {
    role: "button",
    requiredAttributes: ["aria-pressed"],
    keyboardInteractions: ["Enter", "Space"],
  },
  registry: {
    category: "action",
    tags: ["toggle", "press", "on-off"],
    renderMode: "inline",
    exampleProps: { children: "Toggle" },
    states: [
      { name: "hover", driver: "wrapper" },
      { name: "pressed", driver: "prop", prop: "pressed", value: true },
      { name: "focus", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: {},
    slashMenu: {
      title: "Toggle",
      subtext: "Pressable toggle button that holds a pressed/unpre...",
      aliases: ["toggle","toggle","press","on-off"],
      icon: "power1",
    },
  },

});
