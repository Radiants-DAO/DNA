import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface TextAreaProps {
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
}

export const TextAreaMeta = defineComponentMeta<TextAreaProps>()({
  name: "TextArea",
  description: "Multi-line text input with semantic token styling. Shares visual language with Input.",
  props: {
    error: {
      type: "boolean",
      default: false,
      description: "Shows error state styling",
    },
    fullWidth: {
      type: "boolean",
      default: false,
      description: "Makes textarea take full container width",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disables the textarea",
    },
    placeholder: {
      type: "string",
      description: "Placeholder text",
    },
    rows: {
      type: "number",
      description: "Visible number of text lines",
    },
  },
  slots: {},
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
  examples: [
    { name: "Basic textarea", code: '<TextArea placeholder="Write a message..." />' },
    {
      name: "With label",
      code: '<>\n  <Label htmlFor="msg">Message</Label>\n  <TextArea id="msg" placeholder="Your message here" />\n</>',
    },
  ],
  registry: {
    category: "form",
    tags: ["text", "multiline", "textarea"],
    renderMode: "custom",
    states: ["focus", "error", "disabled"],
  },
});
