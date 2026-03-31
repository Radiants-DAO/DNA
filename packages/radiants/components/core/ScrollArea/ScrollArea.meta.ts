import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ScrollAreaProps {
  orientation?: string;
  type?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ScrollAreaMeta = defineComponentMeta<ScrollAreaProps>()({
  name: "ScrollArea",
  description:
    "Custom scrollable container with styled scrollbars. Provides consistent scroll UI across browsers.",
  subcomponents: ["ScrollAreaViewport"],
  props: {
    orientation: {
      type: "string",
      description: "Scroll direction: horizontal, vertical, or both",
    },
    type: {
      type: "string",
      description:
        "Scrollbar visibility behavior: auto, always, scroll, hover",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {
    children: {
      description: "Scrollable content",
    },
  },
  examples: [
    {
      name: "Vertical scroll area",
      code: '<ScrollArea className="h-48">\n  <div className="p-4">\n    {Array.from({length: 20}, (_, i) => <p key={i}>Item {i + 1}</p>)}\n  </div>\n</ScrollArea>',
    },
  ],
  registry: {
    category: "layout",
    tags: ["scroll", "overflow", "container"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "inline",
    render: "./blocknote/renders/ScrollArea",
    propSchema: {},
    slashMenu: {
      title: "ScrollArea",
      subtext: "Custom scrollable container with styled scrollbars...",
      aliases: ["scrollarea","scroll","overflow","container"],
      icon: "scroll-vertical",
    },
  },

});
