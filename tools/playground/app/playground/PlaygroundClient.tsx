"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { PlaygroundCanvas, type PlaygroundCanvasHandle } from "./PlaygroundCanvas";
import { ModeToolbar, type EditorMode, type FeedbackType } from "./ModeToolbar";
import { EditorModeContext } from "./editor-mode-context";
import { CaptureService } from "./components/CaptureService";
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

  // Playground chrome is always dark — color mode only affects component cards.
  // Component cards scope their own color mode via the colorMode prop.
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);

  const handleFocusNode = useCallback((registryId: string, variantLabel?: string) => {
    canvasRef.current?.focusNode(registryId, variantLabel);
  }, []);

  // Keyboard shortcuts: A = annotate, V = variation, Esc = back to select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "c" || e.key === "C") {
        setEditorMode("comment");
        setActiveFeedbackType("comment");
      }
      if (e.key === "Escape") {
        if (editorMode === "comment") {
          setEditorMode("component-id");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorMode]);

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
        <CaptureService />
      </EditorModeContext.Provider>
    </ReactFlowProvider>
  );
}
