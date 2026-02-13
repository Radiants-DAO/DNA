/**
 * EditorLayout - Main layout for the DevTools panel
 *
 * Structure:
 * - LeftTabBar: Docked vertical icon bar (Components, Assets, Variables, Designer, Mutations, Feedback)
 * - SettingsBar: Docked top bar with connection status, search, settings
 * - Main content: Tab panel content or PreviewCanvas (when no tab active)
 *
 * Simplified version for Chrome extension:
 * - Removes Tauri-specific hooks (useDevServer, useDevServerReady)
 * - Removes SpatialCanvas, ComponentCanvas (no file system access)
 * - Uses content script messaging for page interaction
 */

import { useState, useEffect } from "react";
import { LeftTabBar, type TabId } from "./LeftTabBar";
import { DesignerContent, MutationsContent } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { SettingsBar } from "./SettingsBar";
import { CommentMode } from "../CommentMode";
import { TextEditMode } from "../TextEditMode";
import { ComponentIdMode } from "../ComponentIdMode";
import { ComponentsPanel } from "../ComponentsPanel";
import { AssetsPanel } from "../AssetsPanel";
import { VariablesPanel } from "../VariablesPanel";
import { AccessibilityAuditPanel } from "../AccessibilityAuditPanel";
import { FeedbackPanel } from "../FeedbackPanel";
import { useAppStore } from "../../stores/appStore";
import { DogfoodBoundary } from "../ui/DogfoodBoundary";

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case "components":
      return <ComponentsPanel />;
    case "assets":
      return <AssetsPanel />;
    case "variables":
      return <VariablesPanel />;
    case "accessibility":
      return <AccessibilityAuditPanel />;
    case "designer":
      return <DesignerContent />;
    case "mutations":
      return <MutationsContent />;
    case "feedback":
      return <FeedbackPanel />;
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export function EditorLayout() {
  const editorMode = useAppStore((s) => s.editorMode);
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const activePanel = useAppStore((s) => s.activePanel);

  // Preview background state
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  // Active tab state (null = show PreviewCanvas)
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  // Auto-switch to feedback tab when comment mode activates
  useEffect(() => {
    if (activeFeedbackType) {
      setActiveTab("feedback");
    }
  }, [activeFeedbackType]);

  // Drive tab focus from UI panel intents (e.g. typography focus while in T mode).
  useEffect(() => {
    if (!activePanel) return;
    if (activePanel === "feedback") {
      setActiveTab("feedback");
      return;
    }
    if (
      activePanel === "typography" ||
      activePanel === "layout" ||
      activePanel === "spacing" ||
      activePanel === "colors"
    ) {
      setActiveTab("designer");
    }
  }, [activePanel]);

  return (
    <DogfoodBoundary
      name="EditorLayout"
      file="layout/EditorLayout.tsx"
      category="layout"
    >
      <div
        className={`h-screen flex overflow-hidden ${
          previewBg === "light"
            ? "bg-neutral-100 text-neutral-900"
            : "bg-neutral-950 text-neutral-100"
        }`}
        data-devflow-id="editor-layout"
        data-editor-mode={editorMode}
        data-theme={previewBg}
      >
        {/* Docked Left Tab Bar */}
        <LeftTabBar activeTab={activeTab} onTabChange={setActiveTab} theme={previewBg} />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Docked Settings Bar */}
          <SettingsBar previewBg={previewBg} setPreviewBg={setPreviewBg} />

          {/* Content Area */}
          <div
            className="flex-1 overflow-hidden"
            data-devflow-id="main-content"
          >
            {activeTab ? (
              <div
                id={`tabpanel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={activeTab}
                className={`h-full overflow-y-auto ${
                  previewBg === "light" ? "bg-white" : "bg-neutral-900"
                }`}
              >
                <TabContent tab={activeTab} />
              </div>
            ) : (
              <PreviewCanvas previewBg={previewBg} />
            )}
          </div>
        </div>

        {/* Mode Overlays */}
        <CommentMode />
        <TextEditMode />
        <ComponentIdMode />
      </div>
    </DogfoodBoundary>
  );
}

export default EditorLayout;
