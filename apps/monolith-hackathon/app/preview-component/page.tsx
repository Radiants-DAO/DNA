"use client";

import { PreviewPage } from "@rdna/preview/page";
import { Button, AppWindow, CrtOverlay, NebulaBackground } from "@rdna/monolith/components/core";

const registry: Record<string, React.ComponentType> = {
  Button,
  AppWindow,
  CrtOverlay,
  NebulaBackground,
};

export default function Page() {
  return <PreviewPage registry={registry} />;
}
