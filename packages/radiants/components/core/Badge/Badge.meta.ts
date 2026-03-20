import { defineComponentMeta } from "@rdna/preview/define-component-meta";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const BadgeMeta = defineComponentMeta<BadgeProps>()({
  name: "Badge",
  description: "Status indicator and label component with semantic color variants.",
  props: {
    variant: {
      type: "enum",
      values: ["default", "success", "warning", "error", "info"],
      default: "default",
      description: "Visual variant determining background color for status indication",
    },
    size: {
      type: "enum",
      values: ["sm", "md"],
      default: "md",
      description: "Size preset controlling padding and text size",
    },
  },
  slots: {
    children: { description: "Badge label text or content" },
  },
  examples: [
    { name: "Default badge", code: "<Badge>Label</Badge>" },
    { name: "Success status", code: '<Badge variant="success">Active</Badge>' },
    { name: "Warning status", code: '<Badge variant="warning">Pending</Badge>' },
    { name: "Error status", code: '<Badge variant="error">Failed</Badge>' },
    { name: "Info status", code: '<Badge variant="info">New</Badge>' },
    { name: "Small badge", code: '<Badge size="sm">Tiny</Badge>' },
  ],
  tokenBindings: {
    base: { font: "heading", border: "line", text: "main" },
    default: { background: "page", text: "main", border: "line" },
    success: { background: "success", text: "main", border: "line" },
    warning: { background: "warning", text: "main", border: "line" },
    error: { background: "danger", text: "main", border: "line" },
    info: { background: "link", text: "main", border: "line" },
  },
  registry: {
    category: "feedback",
    tags: ["status", "label", "indicator"],
    renderMode: "inline",
    variants: [
      { label: "Default", props: { variant: "default" } },
      { label: "Success", props: { variant: "success" } },
      { label: "Warning", props: { variant: "warning" } },
      { label: "Error", props: { variant: "error" } },
      { label: "Info", props: { variant: "info" } },
    ],
  },
});
