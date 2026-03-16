"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { ModeToolbar, type EditorMode, type FeedbackType } from "./ModeToolbar";
import { EditorModeContext } from "./editor-mode-context";
import { registry } from "./registry";
import { isRenderable } from "./types";

export function PlaygroundClient() {
  const canvasRef = useRef<PlaygroundCanvasHandle>(null);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
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

  const handleFocusNode = useCallback((registryId: string, variantLabel?: string) => {
    canvasRef.current?.focusNode(registryId, variantLabel);
  }, []);

  // Keyboard shortcuts: V = select, C = comment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "v" || e.key === "V") {
        setEditorMode("component-id");
      }
      if (e.key === "c" || e.key === "C") {
        setEditorMode("comment");
        setActiveFeedbackType("comment");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ReactFlowProvider>
      <EditorModeContext.Provider value={{ editorMode, setEditorMode }}>
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          <PlaygroundCanvas ref={canvasRef} entries={entries} />
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
            <ModeToolbar
              editorMode={editorMode}
              onSetEditorMode={setEditorMode}
              activeFeedbackType={activeFeedbackType}
              onSetActiveFeedbackType={setActiveFeedbackType}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
              selectedPackage={selectedPackage}
              onFocusNode={handleFocusNode}
            />
          </div>
        </div>
      </EditorModeContext.Provider>
    </ReactFlowProvider>
  );
}
