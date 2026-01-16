import { useState, useEffect } from "react";
import { commands, VersionInfo } from "./bindings";
import { useProjectStore } from "./stores/projectStore";
import { useAppStore } from "./stores/appStore";
import {
  ProjectPicker,
  ModeToolbar,
  PreviewModeIndicator,
  ComponentIdMode,
  LayersPanel,
  TextEditMode,
  ColorsPanel,
  TypographyPanel,
  SpacingPanel,
  LayoutPanel,
  WatcherStatus,
} from "./components";
import { useKeyboardShortcuts, useFileWatcher } from "./hooks";

function App() {
  const { currentProject, initialize } = useProjectStore();
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const editorMode = useAppStore((s) => s.editorMode);
  const activePanel = useAppStore((s) => s.activePanel); // Must be before early returns
  const isPreviewMode = editorMode === "preview";
  const isComponentIdMode = editorMode === "component-id";
  const hasActivePanel = activePanel !== null;

  // Enable keyboard shortcuts globally
  useKeyboardShortcuts();

  // Start file watcher when project is opened
  const { watcherActive } = useFileWatcher(currentProject?.path ?? null);

  useEffect(() => {
    initialize();
    commands.getVersion().then(setVersion);
  }, []);

  // Show project picker if no project selected
  if (!currentProject) {
    return <ProjectPicker />;
  }

  // Preview mode: render clean page without DevTools chrome
  if (isPreviewMode) {
    return (
      <main className="min-h-screen bg-background text-text">
        <div className="p-8">
          <p className="text-center text-text-muted">
            Preview mode - Page renders clean without DevTools UI
          </p>
        </div>
        <PreviewModeIndicator />
      </main>
    );
  }

  // Main editor view with toolbar
  return (
    <main className={`min-h-screen bg-background text-text p-8 ${isComponentIdMode ? "pr-72" : ""} ${hasActivePanel ? "pr-80" : ""}`}>
      {/* Mode overlays */}
      <ComponentIdMode />
      <TextEditMode />
      <LayersPanel />
      <ColorsPanel />
      <TypographyPanel />
      <SpacingPanel />
      <LayoutPanel />
      <WatcherStatus />

      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{currentProject.name}</h1>
            <p className="text-sm text-text-muted">{currentProject.path}</p>
          </div>
          <div className="flex items-center gap-4">
            <ModeToolbar />
            <SwitchProjectButton />
          </div>
        </header>

        {version && (
          <div className="bg-surface rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold mb-2">Version Info</h2>
            <p className="text-sm text-text-muted">
              App: v{version.version} | Tauri: v{version.tauri_version}
            </p>
          </div>
        )}

        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Project Loaded</h2>
          <p className="text-text-muted">
            The page editor UI will be implemented in subsequent tasks.
          </p>
          <ModeIndicator />
        </div>

        <div className="mt-8 text-center text-text-muted text-sm">
          <p>Tauri 2.0 + React 19 + TypeScript + Tailwind v4</p>
          <p className="mt-1">Type-safe IPC via tauri-specta</p>
        </div>
      </div>
    </main>
  );
}

function ModeIndicator() {
  const editorMode = useAppStore((s) => s.editorMode);

  const modeLabels: Record<string, string> = {
    normal: "Normal Mode - Standard cursor behavior",
    "component-id": "Component ID Mode (V) - Click to select components",
    "text-edit": "Text Edit Mode (T) - Click text to edit",
    preview: "Preview Mode (P) - Clean view without DevTools",
  };

  return (
    <div className="mt-4 p-3 bg-background/50 rounded-lg">
      <p className="text-sm text-text-muted">
        <strong>Current Mode:</strong> {modeLabels[editorMode]}
      </p>
      <p className="text-xs text-text-muted mt-1">
        Press <kbd className="bg-surface px-1 rounded">Escape</kbd> to exit any mode
      </p>
    </div>
  );
}

function SwitchProjectButton() {
  const { openProject } = useProjectStore();

  return (
    <button
      onClick={openProject}
      className="px-4 py-2 text-sm bg-surface hover:bg-surface/80 rounded-lg transition-colors"
    >
      Switch Project
    </button>
  );
}

export default App;
