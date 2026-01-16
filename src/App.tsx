import { useEffect } from "react";
import { useProjectStore } from "./stores/projectStore";
import { useAppStore } from "./stores/appStore";
import { ProjectPicker, PreviewModeIndicator, FirstRunWizard } from "./components";
import { DevModeOverlay } from "./components/DevModeOverlay";
import { EditorLayout } from "./components/layout";
import { useKeyboardShortcuts, useFileWatcher } from "./hooks";

function App() {
  const { currentProject, initialize } = useProjectStore();
  const editorMode = useAppStore((s) => s.editorMode);
  const isPreviewMode = editorMode === "preview";

  // Enable keyboard shortcuts globally
  useKeyboardShortcuts();

  // Start file watcher when project is opened
  useFileWatcher(currentProject?.path ?? null);

  useEffect(() => {
    initialize();
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

  // Main editor view with 3-panel layout
  return (
    <>
      <EditorLayout />
      <FirstRunWizard />
    </>
  );
}

export default App;
