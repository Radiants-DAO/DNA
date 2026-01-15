import { useProjectStore, RecentProject } from "../stores/projectStore";

export function ProjectPicker() {
  const {
    recentProjects,
    isLoading,
    error,
    openProject,
    selectRecentProject,
    clearError,
  } = useProjectStore();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="max-w-lg w-full px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">RadFlow</h1>
          <p className="text-text-muted">Visual Design System Editor</p>
        </div>

        <div className="bg-surface rounded-lg p-6">
          <button
            onClick={openProject}
            className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
          >
            <FolderIcon />
            Open Project
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 text-xs underline mt-1 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {recentProjects.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-text-muted mb-3">
                Recent Projects
              </h2>
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <RecentProjectItem
                    key={project.path}
                    project={project}
                    onSelect={selectRecentProject}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Select a folder containing package.json or tsconfig.json
        </p>
      </div>
    </div>
  );
}

interface RecentProjectItemProps {
  project: RecentProject;
  onSelect: (project: RecentProject) => void;
}

function RecentProjectItem({ project, onSelect }: RecentProjectItemProps) {
  const displayPath = shortenPath(project.path);

  return (
    <button
      onClick={() => onSelect(project)}
      className="w-full text-left px-4 py-3 rounded-lg bg-background hover:bg-background/80 transition-colors group"
    >
      <div className="font-medium text-text group-hover:text-primary transition-colors">
        {project.name}
      </div>
      <div className="text-xs text-text-muted truncate">{displayPath}</div>
    </button>
  );
}

function shortenPath(path: string): string {
  // Replace home directory with ~
  const home = "/Users/";
  if (path.startsWith(home)) {
    const afterHome = path.substring(home.length);
    const firstSlash = afterHome.indexOf("/");
    if (firstSlash !== -1) {
      return "~" + afterHome.substring(firstSlash);
    }
  }
  return path;
}

function FolderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
