import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import {
  inputSizeMetaProp,
  sharedInputShellMetaProps,
  type InputShellProps,
} from "./Input.types.ts";

interface InputProps extends InputShellProps {
  iconName?: string;
}

export const InputMeta = defineComponentMeta<InputProps>()({
  name: "Input",
  description:
    "Text input with semantic token styling. Works standalone or as a compound component with Input.Root for accessible form fields with labels, descriptions, and validation.",
  subcomponents: [
    "Input.Root",
    "Input.Label",
    "Input.Description",
    "Input.Error",
    "Input.Validity",
  ],
  props: {
    size: inputSizeMetaProp,
    ...sharedInputShellMetaProps,
    iconName: {
      type: "string",
      description: "Icon name for leading icon slot",
    },
  },
  slots: {
    icon: { description: "Leading icon slot" },
    Root: { description: "Accessible form field wrapper (Base UI Field.Root)" },
    Label: { description: "Auto-wired label with optional required indicator" },
    Description: { description: "Help text displayed below the control" },
    Error: { description: "Error message displayed when the field is invalid" },
    Validity: { description: "Render prop exposing native validity state" },
  },
  tokenBindings: {
    default: {
      background: "page",
      text: "main",
      border: "line",
      placeholder: "mute",
      focusRing: "focus",
      label: "main",
      description: "mute",
    },
    error: {
      border: "danger",
      focusRing: "danger",
      errorText: "danger",
    },
  },
  examples: [
    {
      name: "Standalone input",
      code: '<Input placeholder="Search..." size="sm" />',
    },
    {
      name: "Accessible form field",
      code: '<Input.Root>\n  <Input.Label required>Email</Input.Label>\n  <Input type="email" placeholder="you@example.com" />\n  <Input.Description>We\'ll never share your email.</Input.Description>\n  <Input.Error>Enter a valid email.</Input.Error>\n</Input.Root>',
    },
    {
      name: "TextArea inside Root",
      code: '<Input.Root>\n  <Input.Label>Message</Input.Label>\n  <TextArea placeholder="Write a message..." />\n</Input.Root>',
    },
  ],
  replaces: [
    {
      element: "input",
      import: "@rdna/radiants/components/core",
      note: "Text-like inputs only in v1",
    },
  ],
  registry: {
    category: "form",
    tags: ["text", "field", "form", "input", "label", "validation"],
    renderMode: "custom",
    exampleProps: { placeholder: "Type something..." },
    states: [
      { name: "focus", driver: "wrapper" },
      { name: "error", driver: "wrapper" },
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: { size: { prop: "size" } },
    slashMenu: {
      title: "Input",
      subtext: "Text input with semantic token styling. Works stan...",
      aliases: ["input","text","field","form"],
      icon: "cursor-text",
    },
  },

});
