"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { ForcedStateProvider } from "./ForcedStateContext";
import { registry } from "./registry";
import { isRenderable, type ForcedState } from "./types";

export function PlaygroundClient() {
  const canvasRef = useRef<PlaygroundCanvasHandle>(null);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const [forcedState, setForcedState] = useState<ForcedState>("default");

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

  // Canvas and toolbar are always dark — only nodes switch color mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);

  const handleFocusNode = useCallback((registryId: string) => {
    canvasRef.current?.focusNode(registryId);
  }, []);

  return (
    <ReactFlowProvider>
      <ForcedStateProvider value={forcedState}>
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          <PlaygroundToolbar
            selectedPackage={selectedPackage}
            packages={packages}
            onSelectPackage={setSelectedPackage}
            onFocusNode={handleFocusNode}
            colorMode={colorMode}
            onToggleColorMode={toggleColorMode}
            forcedState={forcedState}
            onSetForcedState={setForcedState}
          />
          <PlaygroundCanvas ref={canvasRef} entries={entries} />
        </div>
      </ForcedStateProvider>
    </ReactFlowProvider>
  );
}
