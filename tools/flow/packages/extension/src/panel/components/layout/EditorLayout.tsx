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
// LeftPanel moved to on-page Shadow DOM (content/ui/leftSidebar.ts)
import { RightPanel } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { SettingsBar } from "./SettingsBar";
import { CommentMode } from "../CommentMode";
import { TextEditMode } from "../TextEditMode";
import { ComponentIdMode } from "../ComponentIdMode";
import { useAppStore } from "../../stores/appStore";
import { DogfoodBoundary } from '../ui/DogfoodBoundary';

export function EditorLayout() {
  const editorMode = useAppStore((s) => s.editorMode);

  // Preview background state
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  return (
    <DogfoodBoundary name="EditorLayout" file="layout/EditorLayout.tsx" category="layout">
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

        {/* Floating Right Panel */}
        <RightPanel />

        {/* Floating Settings Bar */}
        <SettingsBar previewBg={previewBg} setPreviewBg={setPreviewBg} />

        {/* Mode Overlays */}
        <CommentMode />
        <TextEditMode />
        <ComponentIdMode />
      </div>
    </DogfoodBoundary>
  );
}

export default EditorLayout;
