import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface InputProps {
  size?: "sm" | "md" | "lg";
  error?: boolean;
  fullWidth?: boolean;
  iconName?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const InputMeta = defineComponentMeta<InputProps>()({
  name: "Input",
  description: "Text input field with optional icon and error state",
  props: {
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset for input height and padding",
    },
    error: {
      type: "boolean",
      default: false,
      description: "Shows error state styling",
    },
    fullWidth: {
      type: "boolean",
      default: false,
      description: "Makes input take full container width",
    },
    iconName: {
      type: "string",
      description: "Icon name for leading icon slot",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disables the input",
    },
  },
  slots: {
    icon: { description: "Leading icon slot" },
  },
  tokenBindings: {
    default: {
      background: "page",
      text: "main",
      border: "line",
      placeholder: "mute",
      focusRing: "focus",
    },
    error: {
      border: "danger",
      focusRing: "danger",
    },
  },
  registry: {
    category: "form",
    tags: ["text", "field", "form"],
    renderMode: "inline",
    exampleProps: { placeholder: "Type something..." },
    states: ["focus", "error", "disabled"],
  },
});
