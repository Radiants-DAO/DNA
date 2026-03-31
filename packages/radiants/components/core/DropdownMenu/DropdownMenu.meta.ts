import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: string;
  position?: string;
}

export const DropdownMenuMeta = defineComponentMeta<DropdownMenuProps>()({
  name: "DropdownMenu",
  description:
    "Dropdown menu triggered by a button or icon. Supports keyboard navigation, separators, and nested items.",
  subcomponents: [
    "DropdownMenuTrigger",
    "DropdownMenuContent",
    "DropdownMenuItem",
    "DropdownMenuSeparator",
    "DropdownMenuLabel",
  ],
  props: {
    open: {
      type: "boolean",
      description: "Controlled open state",
    },
    defaultOpen: {
      type: "boolean",
      description: "Default open state",
    },
    onOpenChange: {
      type: "string",
      description: "Callback fired when menu opens or closes",
    },
    position: {
      type: "string",
      description: "Preferred menu placement relative to trigger",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic dropdown menu",
      code: "<DropdownMenu>\n  <DropdownMenuTrigger>Options</DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Edit</DropdownMenuItem>\n    <DropdownMenuItem>Duplicate</DropdownMenuItem>\n    <DropdownMenuSeparator />\n    <DropdownMenuItem>Delete</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>",
    },
  ],
  registry: {
    category: "action",
    tags: ["menu", "actions", "overflow"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/DropdownMenu",
    propSchema: {},
    slashMenu: {
      title: "DropdownMenu",
      subtext: "Dropdown menu triggered by a button or icon. Suppo...",
      aliases: ["dropdownmenu","menu","actions","overflow"],
      icon: "chevron-down",
    },
  },

});
