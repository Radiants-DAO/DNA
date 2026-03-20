import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ContextMenuProps {
  className?: string;
  children?: unknown;
}

export const ContextMenuMeta = defineComponentMeta<ContextMenuProps>()({
  name: "ContextMenu",
  description: "Right-click context menu with keyboard navigation support.",
  subcomponents: ["ContextMenuContent", "ContextMenuItem", "ContextMenuSeparator"],
  props: {
    className: {
      type: "string",
      description: "Additional CSS class names",
    },
  },
  slots: {
    children: {
      description: "Trigger element and ContextMenuContent",
    },
  },
  examples: [
    {
      name: "Basic context menu",
      code: "<ContextMenu>\n  <div>Right-click me</div>\n  <ContextMenuContent>\n    <ContextMenuItem>Copy</ContextMenuItem>\n    <ContextMenuItem>Paste</ContextMenuItem>\n    <ContextMenuSeparator />\n    <ContextMenuItem>Delete</ContextMenuItem>\n  </ContextMenuContent>\n</ContextMenu>",
    },
  ],
  registry: {
    category: "action",
    tags: ["right-click", "menu"],
    renderMode: "custom",
  },
});
