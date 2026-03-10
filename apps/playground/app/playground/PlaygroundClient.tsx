"use client";

import { useRef, useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { PlaygroundSidebar } from "./PlaygroundSidebar";
import { ComparisonView } from "./ComparisonView";
import type { ComparisonPair } from "./types";

export type ViewMode = "canvas" | "compare";

export function PlaygroundClient() {
  const canvasRef = useRef<PlaygroundCanvasHandle>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [comparisonPair, setComparisonPair] = useState<ComparisonPair | null>(null);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");

  const handleAddComponent = useCallback((registryId: string) => {
    canvasRef.current?.addComponentNode(registryId);
  }, []);

  const handleCompare = useCallback((pair: ComparisonPair) => {
    setComparisonPair(pair);
    setViewMode("compare");
  }, []);

  const handleBackToCanvas = useCallback(() => {
    setViewMode("canvas");
    setComparisonPair(null);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode((m) => (m === "light" ? "dark" : "light"));
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <PlaygroundSidebar
          onAddComponent={handleAddComponent}
          onCompare={handleCompare}
          viewMode={viewMode}
          onBackToCanvas={handleBackToCanvas}
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
        />
        {viewMode === "canvas" ? (
          <PlaygroundCanvas ref={canvasRef} />
        ) : (
          comparisonPair && (
            <ComparisonView pair={comparisonPair} colorMode={colorMode} />
          )
        )}
      </div>
    </ReactFlowProvider>
  );
}
