import { TitleBar } from "./TitleBar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { PreviewCanvas } from "./PreviewCanvas";
import { StatusBar } from "./StatusBar";

/**
 * EditorLayout - Main 3-panel layout for the visual editor
 *
 * Structure:
 * - TitleBar: Custom frameless window title bar with controls
 * - LeftPanel: Icon rail + expandable panel (Variables, Components, Assets, Layers)
 * - PreviewCanvas: Center preview area with component grid/focused view
 * - RightPanel: Designer panel with CSS property sections
 * - StatusBar: File path, save status, error count
 */
export function EditorLayout() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Title Bar - Custom window chrome */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Icon rail + content */}
        <LeftPanel />

        {/* Center - Preview Canvas */}
        <PreviewCanvas />

        {/* Right Panel - Properties */}
        <RightPanel />
      </div>

      {/* Status Bar */}
      <StatusBar
        filePath="src/components/Button.tsx"
        lastSaved={new Date()}
        errorCount={0}
      />
    </div>
  );
}

export default EditorLayout;
