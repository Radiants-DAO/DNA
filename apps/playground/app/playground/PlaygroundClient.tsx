"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { registry } from "./registry";
import { isRenderable } from "./types";

export function PlaygroundClient() {
  const canvasRef = useRef<PlaygroundCanvasHandle>(null);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  /** Unique package names from the registry */
  const packages = useMemo(
    () => [...new Set(registry.map((e) => e.packageName))],
    [],
  );
  const [selectedPackage, setSelectedPackage] = useState(packages[0] ?? "@rdna/radiants");

  /** Renderable entries for the selected package */
  const entries = useMemo(
    () => registry.filter((e) => e.packageName === selectedPackage && isRenderable(e)),
    [selectedPackage],
  );

  const toggleColorMode = useCallback(() => {
    setColorMode((m) => (m === "light" ? "dark" : "light"));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", colorMode === "dark");
    document.documentElement.classList.toggle("light", colorMode === "light");
  }, [colorMode]);

  const handleFocusNode = useCallback((registryId: string) => {
    canvasRef.current?.focusNode(registryId);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <PlaygroundToolbar
          selectedPackage={selectedPackage}
          packages={packages}
          onSelectPackage={setSelectedPackage}
          onFocusNode={handleFocusNode}
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
        />
        <PlaygroundCanvas ref={canvasRef} entries={entries} />
      </div>
    </ReactFlowProvider>
  );
}
