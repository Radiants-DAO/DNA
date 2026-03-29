import type { ReactNode } from "react";
import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface AppWindowProps {
  id: string;
  title: string;
  children?: ReactNode;
  open?: boolean;
  resizable?: boolean;
  presentation?: "window" | "fullscreen" | "mobile";
}

export const AppWindowMeta = defineComponentMeta<AppWindowProps>()({
  name: "AppWindow",
  description:
    "Desktop-style application window with draggable chrome, optional resize handles, and mobile/fullscreen presentations.",
  subcomponents: [
    "AppWindow",
    "AppWindowBody",
    "AppWindowSplitView",
    "AppWindowPane",
  ],
  props: {
    id: {
      type: "string",
      description: "Stable window identifier used for aria and share-link behavior.",
    },
    title: {
      type: "string",
      description: "Window title shown in the title bar.",
    },
    open: {
      type: "boolean",
      default: true,
      description: "Whether the window is currently rendered.",
    },
    resizable: {
      type: "boolean",
      default: true,
      description: "Enables resize handles in desktop window presentation.",
    },
    presentation: {
      type: "enum",
      values: ["window", "fullscreen", "mobile"],
      default: "window",
      description: "Selects windowed, fullscreen, or mobile shell presentation.",
    },
  },
  slots: {
    children: {
      description: "Window content, usually an AppWindowBody or custom app layout.",
    },
  },
  examples: [
    {
      name: "Desktop window shell",
      code: "<AppWindow id=\"about\" title=\"About\">\n  <AppWindowBody>Content</AppWindowBody>\n</AppWindow>",
    },
    {
      name: "Two-pane compare layout",
      code: "<AppWindow id=\"lab\" title=\"Control Surface Lab\">\n  <AppWindowSplitView>\n    <AppWindowPane>Legacy</AppWindowPane>\n    <AppWindowPane>RDNA</AppWindowPane>\n  </AppWindowSplitView>\n</AppWindow>",
    },
  ],
  registry: {
    category: "layout",
    tags: ["window", "desktop", "shell"],
    renderMode: "description-only",
  },
});
