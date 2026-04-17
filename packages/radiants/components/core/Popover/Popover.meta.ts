import type React from "react";
import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export type PopoverPosition = "top" | "bottom" | "left" | "right";

export interface PopoverProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when open state changes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
  /** Callback fired after open/close animations complete */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Ref for imperative actions (close, unmount) */
  actionsRef?: React.RefObject<{ close: () => void; unmount: () => void } | null>;
  /** Position relative to trigger */
  position?: PopoverPosition;
  /** Children */
  children: React.ReactNode;
}

export const PopoverMeta = defineComponentMeta<PopoverProps>()({
  name: "Popover",
  description:
    "Floating panel anchored to a trigger element. Supports keyboard navigation and focus management.",
  subcomponents: ["PopoverTrigger", "PopoverContent"],
  props: {
    open: {
      type: "boolean",
    },
    defaultOpen: {
      type: "boolean",
    },
    onOpenChange: {
      type: "string",
      description: "Callback fired when popover opens or closes",
    },
    position: {
      type: "string",
      description: "Preferred popover placement relative to trigger",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic popover",
      code: "<Popover.Root>\n  <PopoverTrigger>Open</PopoverTrigger>\n  <PopoverContent>Popover content here</PopoverContent>\n</Popover.Root>",
    },
  ],
  registry: {
    category: "overlay",
    tags: ["popup", "tooltip", "float"],
    renderMode: "custom",
    controlledProps: ["position"],
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Popover",
    propSchema: {},
    slashMenu: {
      title: "Popover",
      subtext: "Floating panel anchored to a trigger element. Supp...",
      aliases: ["popover","popup","tooltip","float"],
      icon: "comments-blank",
    },
  },

});
