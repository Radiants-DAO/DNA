import { useState, useEffect } from "react";
import { commands, VersionInfo } from "./bindings";
import { useProjectStore } from "./stores/projectStore";
import { ProjectPicker } from "./components/ProjectPicker";

function App() {
  const { currentProject, initialize } = useProjectStore();
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    initialize();
    commands.getVersion().then(setVersion);
  }, []);

  // Show project picker if no project selected
  if (!currentProject) {
    return <ProjectPicker />;
  }

  // Main editor view (placeholder for now)
  return (
    <main className="min-h-screen bg-background text-text p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{currentProject.name}</h1>
            <p className="text-sm text-text-muted">{currentProject.path}</p>
          </div>
          <SwitchProjectButton />
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
        </div>

        <div className="mt-8 text-center text-text-muted text-sm">
          <p>Tauri 2.0 + React 19 + TypeScript + Tailwind v4</p>
          <p className="mt-1">Type-safe IPC via tauri-specta</p>
        </div>
      </div>
    </main>
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
