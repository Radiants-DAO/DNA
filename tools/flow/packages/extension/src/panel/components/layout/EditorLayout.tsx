/**
 * EditorLayout - Main layout for the DevTools panel
 *
 * Structure:
 * - SettingsBar: Floating top-left bar with mode selector, search, settings
 * - LeftPanel: Floating icon bar + panels (Layers, Components)
 * - PreviewCanvas: Center area with inspected tab placeholder
 * - RightPanel: Floating bar + panels (Designer, Mutations)
 *
 * Simplified version for Chrome extension:
 * - Removes Tauri-specific hooks (useDevServer, useDevServerReady)
 * - Removes SpatialCanvas, ComponentCanvas (no file system access)
 * - Uses content script messaging for page interaction
 */

import { useState } from "react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { SettingsBar } from "./SettingsBar";
import { useAppStore } from "../../stores/appStore";

export function EditorLayout() {
  const editorMode = useAppStore((s) => s.editorMode);

  // Preview background state
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  return (
    <div
      className="h-screen flex flex-col bg-neutral-950 overflow-hidden"
      data-devflow-id="editor-layout"
      data-editor-mode={editorMode}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden" data-devflow-id="main-content">
        {/* Center - Preview Canvas */}
        <PreviewCanvas previewBg={previewBg} />
      </div>

      {/* Floating Left Panel */}
      <LeftPanel />

      {/* Floating Right Panel */}
      <RightPanel />

      {/* Floating Settings Bar */}
      <SettingsBar previewBg={previewBg} setPreviewBg={setPreviewBg} />
    </div>
  );
}

export default EditorLayout;
