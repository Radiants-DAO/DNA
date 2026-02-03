import { useEffect, useCallback } from "react";
import { useAppStore } from "./stores/appStore";
import { ProjectPicker } from "./components";
import { EditorLayout } from "./components/layout";
import { useKeyboardShortcuts, useFileWatcher, useSearch } from "./hooks";
import { SearchOverlay } from "./components/search/SearchOverlay";
import type { SearchResult } from "./hooks/useSearch";

function App() {
  const workspace = useAppStore((s) => s.workspace);
  const workspaceLoading = useAppStore((s) => s.workspaceLoading);
  const initializeWorkspace = useAppStore((s) => s.initializeWorkspace);
  const project = useAppStore((s) => s.project);

  // Search state
  const searchState = useSearch();

  // Enable keyboard shortcuts globally with search integration
  useKeyboardShortcuts({
    onOpenSearch: searchState.open,
    onSetSearchScope: searchState.setScope,
    isSearchOpen: searchState.isOpen,
  });

  // Start file watcher when project is opened
  useFileWatcher(project?.path ?? null);

  // Handle search result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    console.log("Selected search result:", result);
  }, []);

  // Initialize workspace on mount (loads recents, auto-opens last workspace)
  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Show workspace picker if no workspace loaded
  if (!workspace && !workspaceLoading) {
    return <ProjectPicker />;
  }

  // Loading state
  if (workspaceLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading workspace...</div>
      </div>
    );
  }

  // Main editor view with 3-panel layout (preview mode handled via CSS in EditorLayout)
  return (
    <>
      <EditorLayout />
      <SearchOverlay searchState={searchState} onSelectResult={handleSelectResult} />
    </>
  );
}

export default App;
