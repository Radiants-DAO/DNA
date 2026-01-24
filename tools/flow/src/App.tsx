import { useEffect, useRef, useCallback } from "react";
import { useProjectStore } from "./stores/projectStore";
import { useAppStore } from "./stores/appStore";
import { ProjectPicker, PreviewModeIndicator } from "./components";
import { EditorLayout } from "./components/layout";
import { useKeyboardShortcuts, useFileWatcher, useSearch } from "./hooks";
import { SearchOverlay } from "./components/search/SearchOverlay";
import type { SearchResult } from "./hooks/useSearch";

// Auto-load this project during development to skip project picker
const DEV_DEFAULT_PROJECT = "/Users/rivermassey/Desktop/dev/radflow-tauri";

function App() {
  const { currentProject, initialize, selectRecentProject } = useProjectStore();
  const editorMode = useAppStore((s) => s.editorMode);
  const isPreviewMode = editorMode === "preview";
  const didAutoLoad = useRef(false);

  // Search state
  const searchState = useSearch();

  // Enable keyboard shortcuts globally with search integration
  useKeyboardShortcuts({
    onOpenSearch: searchState.open,
    onSetSearchScope: searchState.setScope,
    isSearchOpen: searchState.isOpen,
  });

  // Start file watcher when project is opened
  useFileWatcher(currentProject?.path ?? null);

  // Handle search result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    console.log("Selected search result:", result);
    // TODO: Implement scope-specific actions
    // - Elements: Select element in preview, scroll into view
    // - Components: Select component, show in Designer Panel
    // - Layers: Expand tree to layer, select it
    // - Assets: Copy asset path or open preview
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Dev bypass: auto-load default project to skip project picker
  useEffect(() => {
    if (import.meta.env.DEV && !currentProject && !didAutoLoad.current) {
      didAutoLoad.current = true;
      selectRecentProject({
        name: "RadFlow Tauri (Dev)",
        path: DEV_DEFAULT_PROJECT,
        lastOpened: new Date().toISOString(),
      });
    }
  }, [currentProject, selectRecentProject]);

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
      <SearchOverlay searchState={searchState} onSelectResult={handleSelectResult} />
    </>
  );
}

export default App;
