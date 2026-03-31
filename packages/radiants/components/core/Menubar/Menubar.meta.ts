import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface MenubarProps {
  modal?: boolean;
  orientation?: string;
}

export const MenubarMeta = defineComponentMeta<MenubarProps>()({
  name: "Menubar",
  description:
    "Desktop-style application menu bar with keyboard navigation and nested menus.",
  subcomponents: [
    "Menubar.Root",
    "Menubar.Menu",
    "Menubar.Trigger",
    "Menubar.Content",
    "Menubar.Item",
    "Menubar.Separator",
    "Menubar.Label",
  ],
  props: {
    modal: {
      type: "boolean",
      default: false,
      description: "Whether menu traps focus (modal mode)",
    },
    orientation: {
      type: "string",
      default: "horizontal",
      description: "Orientation of the menubar",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic menubar",
      code: '<Menubar.Root>\n  <Menubar.Menu>\n    <Menubar.Trigger>File</Menubar.Trigger>\n    <Menubar.Content>\n      <Menubar.Item>New</Menubar.Item>\n      <Menubar.Item>Open</Menubar.Item>\n      <Menubar.Separator />\n      <Menubar.Item>Save</Menubar.Item>\n    </Menubar.Content>\n  </Menubar.Menu>\n</Menubar.Root>',
    },
  ],
  registry: {
    category: "navigation",
    tags: ["menubar", "menu", "desktop", "file-menu"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Menubar",
    propSchema: {},
    slashMenu: {
      title: "Menubar",
      subtext: "Desktop-style application menu bar with keyboard n...",
      aliases: ["menubar","menubar","menu","desktop"],
      icon: "hamburger",
    },
  },

});
