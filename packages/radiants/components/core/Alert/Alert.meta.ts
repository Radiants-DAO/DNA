import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export type AlertVariant = "default" | "success" | "warning" | "error" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  closable?: boolean;
  onClose?: () => void;
}

export const AlertMeta = defineComponentMeta<AlertProps>()({
  name: "Alert",
  description:
    "Contextual feedback message with semantic color variants. Supports optional title, dismissal, and custom icon slot.",
  props: {
    variant: {
      type: "enum",
      values: ["default", "success", "warning", "error", "info"],
      default: "default",
      description: "Visual variant determining border and background color for semantic context",
    },
    title: {
      type: "string",
      description: "Optional bold heading displayed above the message content",
    },
    closable: {
      type: "boolean",
      default: false,
      description: "Show a dismiss button that triggers onClose when clicked",
    },
    onClose: {
      type: "function",
      description: "Callback fired when the dismiss button is clicked",
    },
  },
  slots: {
    children: { description: "Message content displayed in the alert body" },
    icon: { description: "Optional custom icon overriding the default variant icon" },
  },
  examples: [
    {
      name: "Default alert",
      code: "<Alert>Something happened that you should know about.</Alert>",
    },
    {
      name: "Success",
      code: '<Alert variant="success">Your changes have been saved.</Alert>',
    },
    {
      name: "Closable",
      code: '<Alert closable onClose={() => setVisible(false)}>Dismiss me when ready.</Alert>',
    },
    {
      name: "With title",
      code: '<Alert variant="error" title="Payment failed">Your card was declined. Please update your billing details.</Alert>',
    },
  ],
  tokenBindings: {
    base: {
      padding: "spacing-md",
      gap: "spacing-sm",
      font: "body",
      titleFont: "heading",
      borderWidth: "2px",
      borderRadius: "sm",
    },
    default: {
      background: "page",
      text: "main",
      border: "line",
    },
    success: {
      background: "success/10",
      text: "main",
      border: "success",
    },
    warning: {
      background: "warning/10",
      text: "main",
      border: "warning",
    },
    error: {
      background: "danger/10",
      text: "main",
      border: "danger",
    },
    info: {
      background: "link/10",
      text: "main",
      border: "link",
    },
  },
  registry: {
    category: "feedback",
    tags: ["message", "banner", "notification"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "inline",
    render: "./blocknote/renders/Alert",
    propSchema: { variant: { prop: "variant" } },
    slashMenu: {
      title: "Alert",
      subtext: "RDNA alert callout",
      aliases: ["alert", "callout", "info", "warning"],
      icon: "comments-blank",
    },
  },
});
