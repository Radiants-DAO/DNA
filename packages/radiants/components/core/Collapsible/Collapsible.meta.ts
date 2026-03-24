import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface CollapsibleProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CollapsibleMeta = defineComponentMeta<CollapsibleProps>()({
  name: "Collapsible",
  description:
    "Expandable content section with animated transition. Triggered by a designated trigger element.",
  subcomponents: ["CollapsibleTrigger", "CollapsibleContent"],
  props: {
    defaultOpen: {
      type: "boolean",
      description: "Initial expanded state for uncontrolled usage",
    },
    open: {
      type: "boolean",
      description: "Controlled expanded state",
    },
    onOpenChange: {
      type: "string",
      description: "Callback when expanded state changes",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Prevent toggling",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {
    children: {
      description: "CollapsibleTrigger and CollapsibleContent elements",
    },
  },
  examples: [
    {
      name: "Basic collapsible",
      code: "<Collapsible>\n  <CollapsibleTrigger>Toggle section</CollapsibleTrigger>\n  <CollapsibleContent>\n    <p>Hidden content revealed on click</p>\n  </CollapsibleContent>\n</Collapsible>",
    },
  ],
  replaces: [
    { element: "details", import: "@rdna/radiants/components/core" },
    {
      element: "summary",
      import: "@rdna/radiants/components/core",
      note: "Use Collapsible.Trigger for the summary surface",
    },
  ],
  wraps: "@base-ui/react/collapsible",
  registry: {
    category: "layout",
    tags: ["collapse", "expand", "toggle"],
    renderMode: "custom",
  },
});
