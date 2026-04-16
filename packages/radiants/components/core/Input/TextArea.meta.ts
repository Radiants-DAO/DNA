import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import {
  sharedInputShellMetaProps,
  type TextAreaShellProps,
} from "./Input.types.ts";

interface TextAreaProps extends TextAreaShellProps {
  rows?: number;
}

export const TextAreaMeta = defineComponentMeta<TextAreaProps>()({
  name: "TextArea",
  sourcePath: "packages/radiants/components/core/Input/Input.tsx",
  description: "Multi-line text input with semantic token styling. Shares visual language with Input.",
  props: {
    ...sharedInputShellMetaProps,
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
      name: "With label (Input.Root)",
      code: '<Input.Root>\n  <Input.Label>Message</Input.Label>\n  <TextArea placeholder="Your message here" />\n</Input.Root>',
    },
  ],
  replaces: [{ element: "textarea", import: "@rdna/radiants/components/core" }],
  registry: {
    category: "form",
    tags: ["text", "multiline", "textarea"],
    renderMode: "custom",
    states: [
      { name: "focus", driver: "wrapper" },
      { name: "error", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
