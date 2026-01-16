import { useCallback } from "react";
import { TitleBar } from "./TitleBar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { StatusBar } from "./StatusBar";
import { ResizeDivider } from "./ResizeDivider";
import { useAppStore } from "../../stores/appStore";

/**
 * EditorLayout - Main 3-panel layout for the visual editor
 *
 * Structure:
 * - TitleBar: Custom frameless window title bar with controls
 * - LeftPanel: Icon rail + expandable panel (Variables, Components, Assets, Layers)
 * - ResizeDivider: Draggable divider between left panel and center
 * - PreviewCanvas: Center preview area with component grid/focused view
 * - ResizeDivider: Draggable divider between center and right panel
 * - RightPanel: Designer panel with CSS property sections
 * - StatusBar: File path, save status, error count
 */
export function EditorLayout() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const resetSidebarWidth = useAppStore((s) => s.resetSidebarWidth);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  const panelWidth = useAppStore((s) => s.panelWidth);
  const setPanelWidth = useAppStore((s) => s.setPanelWidth);
  const resetPanelWidth = useAppStore((s) => s.resetPanelWidth);

  // Get selected component for status bar
  const bridgeSelection = useAppStore((s) => s.bridgeSelection);
  const selectedEntry = useAppStore((s) => s.selectedEntry);

  const handleLeftResize = useCallback(
    (delta: number) => {
      setSidebarWidth(sidebarWidth + delta);
    },
    [sidebarWidth, setSidebarWidth]
  );

  const handleRightResize = useCallback(
    (delta: number) => {
      setPanelWidth(panelWidth + delta);
    },
    [panelWidth, setPanelWidth]
  );

  // Determine status bar info from selection
  const selectedFilePath = bridgeSelection?.source?.relativePath ?? selectedEntry?.source?.relativePath ?? null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Title Bar - Custom window chrome */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Icon rail + content */}
        <LeftPanel width={sidebarWidth} />

        {/* Left Resize Divider - only show when panel is expanded */}
        {!sidebarCollapsed && (
          <ResizeDivider
            side="left"
            onResize={handleLeftResize}
            onReset={resetSidebarWidth}
          />
        )}

        {/* Center - Preview Canvas */}
        <PreviewCanvas />

        {/* Right Resize Divider */}
        <ResizeDivider
          side="right"
          onResize={handleRightResize}
          onReset={resetPanelWidth}
        />

        {/* Right Panel - Properties */}
        <RightPanel width={panelWidth} />
      </div>

      {/* Status Bar */}
      <StatusBar
        filePath={selectedFilePath ?? "No selection"}
        lastSaved={null}
        errorCount={0}
      />
    </div>
  );
}

export default EditorLayout;
