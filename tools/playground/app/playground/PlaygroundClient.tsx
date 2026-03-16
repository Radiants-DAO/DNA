"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { ModeToolbar, type EditorMode, type FeedbackType } from "./ModeToolbar";
import { ForcedStateProvider } from "./ForcedStateContext";
import { registry } from "./registry";
import { isRenderable, type ForcedState } from "./types";

export function PlaygroundClient() {
  const canvasRef = useRef<PlaygroundCanvasHandle>(null);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const [forcedState, setForcedState] = useState<ForcedState>("default");
  const [editorMode, setEditorMode] = useState<EditorMode>("component-id");
  const [activeFeedbackType, setActiveFeedbackType] = useState<FeedbackType | null>(null);

  const selectedPackage = useMemo(
    () => [...new Set(registry.map((e) => e.packageName))][0] ?? "@rdna/radiants",
    [],
  );

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
      <ForcedStateProvider value={forcedState}>
        <div className="flex h-screen w-screen overflow-hidden">
          <PlaygroundCanvas ref={canvasRef} entries={entries} />
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
            <ModeToolbar
              editorMode={editorMode}
              onSetEditorMode={setEditorMode}
              activeFeedbackType={activeFeedbackType}
              onSetActiveFeedbackType={setActiveFeedbackType}
              forcedState={forcedState}
              onSetForcedState={setForcedState}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
              selectedPackage={selectedPackage}
              onFocusNode={handleFocusNode}
            />
          </div>
        </div>
      </ForcedStateProvider>
    </ReactFlowProvider>
  );
}
