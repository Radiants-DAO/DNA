import { useState, useEffect, useRef, useCallback } from "react";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useProjectStore, RecentProject } from "../stores/projectStore";

// Relative time formatting
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

// Shorten path for display
function shortenPath(path: string): string {
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

export function ProjectPicker() {
  const {
    recentProjects,
    isLoading,
    error,
    openProject,
    selectRecentProject,
    removeRecentProject,
    clearError,
  } = useProjectStore();

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: RecentProject } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (contextMenu) {
        if (e.key === "Escape") {
          setContextMenu(null);
        }
        return;
      }

      const maxIndex = recentProjects.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
            selectRecentProject(recentProjects[selectedIndex]);
          } else if (selectedIndex === -1) {
            openProject();
          }
          break;
        case "Escape":
          setSelectedIndex(-1);
          break;
      }
    },
    [recentProjects, selectedIndex, selectRecentProject, openProject, contextMenu]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-project-item]");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleContextMenu = (e: React.MouseEvent, project: RecentProject) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, project });
  };

  const handleRemoveFromRecents = () => {
    if (contextMenu) {
      removeRecentProject(contextMenu.project.path);
      setContextMenu(null);
    }
  };

  const handleOpenInFinder = async () => {
    if (contextMenu) {
      try {
        await revealItemInDir(contextMenu.project.path);
      } catch (err) {
        console.error("Failed to open in Finder:", err);
      }
      setContextMenu(null);
    }
  };

  const handleQuickAction = async (action: "docs" | "settings" | "help") => {
    const urls: Record<string, string> = {
      docs: "https://tauri.app/v2/guides/",
      settings: "#settings", // Future: open settings panel
      help: "https://github.com/anthropics/claude-code/issues",
    };

    if (action === "settings") {
      // Settings not yet implemented
      console.log("Settings panel coming soon");
      return;
    }

    try {
      await openUrl(urls[action]);
    } catch (err) {
      console.error(`Failed to open ${action}:`, err);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        {/* Drag region for window - macOS traffic lights appear here */}
        <div
          data-tauri-drag-region
          className="h-10 flex-shrink-0 select-none"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Drag region for window - macOS traffic lights appear here */}
      <div
        data-tauri-drag-region
        className="h-10 flex-shrink-0 select-none"
      />

      <div className="flex-1 flex items-center justify-center overflow-auto">
      <div className="max-w-xl w-full px-8">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <RadFlowLogo />
          </div>
          <h1 className="text-4xl font-bold mb-2">RadFlow</h1>
          <p className="text-text-muted">Visual Design System Editor</p>
        </div>

        {/* Main content card */}
        <div className="bg-surface rounded-lg p-6">
          {/* Open Project Button */}
          <button
            onClick={openProject}
            className={`w-full bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 ${
              selectedIndex === -1 ? "ring-2 ring-primary/50" : ""
            }`}
          >
            <FolderIcon />
            Open Project
          </button>

          {/* New Project (future) */}
          <button
            disabled
            className="w-full mt-3 bg-elevated text-text-muted px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <PlusIcon />
            New Project
          </button>

          {/* Error display */}
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

          {/* Recent Projects */}
          {recentProjects.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-text-muted mb-3">Recent Projects</h2>
              <div ref={listRef} className="space-y-1 max-h-64 overflow-y-auto">
                {recentProjects.map((project, index) => (
                  <RecentProjectItem
                    key={project.path}
                    project={project}
                    isSelected={selectedIndex === index}
                    onSelect={() => selectRecentProject(project)}
                    onContextMenu={(e) => handleContextMenu(e, project)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Empty state for first-time users
            <div className="mt-6 text-center py-8">
              <div className="text-text-muted mb-2">No recent projects</div>
              <p className="text-sm text-text-muted/70">
                Open a project folder to get started
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <div className="border-t border-border pt-4">
            <div className="text-xs text-text-muted mb-3 text-center">Quick Actions</div>
            <div className="flex justify-center gap-4">
              <QuickActionButton
                icon={<BookIcon />}
                label="Documentation"
                onClick={() => handleQuickAction("docs")}
              />
              <QuickActionButton
                icon={<SettingsIcon />}
                label="Settings"
                onClick={() => handleQuickAction("settings")}
              />
              <QuickActionButton
                icon={<HelpIcon />}
                label="Help"
                onClick={() => handleQuickAction("help")}
              />
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-text-muted text-xs mt-6">
          Use arrow keys to navigate, Enter to select
        </p>
      </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-elevated border border-border rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleRemoveFromRecents}
            className="w-full px-4 py-2 text-sm text-left hover:bg-background/50 text-text"
          >
            Remove from list
          </button>
          <button
            onClick={handleOpenInFinder}
            className="w-full px-4 py-2 text-sm text-left hover:bg-background/50 text-text"
          >
            Open in Finder
          </button>
        </div>
      )}
    </div>
  );
}

interface RecentProjectItemProps {
  project: RecentProject;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
}

function RecentProjectItem({
  project,
  isSelected,
  onSelect,
  onContextMenu,
  onMouseEnter,
}: RecentProjectItemProps) {
  const displayPath = shortenPath(project.path);
  const relativeTime = formatRelativeTime(project.lastOpened);

  return (
    <button
      data-project-item
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
        isSelected
          ? "bg-primary/10 ring-1 ring-primary/30"
          : "bg-background hover:bg-background/80"
      }`}
    >
      <div className="flex items-start gap-3">
        <FolderIcon className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text truncate">{project.name}</div>
          <div className="text-xs text-text-muted truncate">{displayPath}</div>
          <div className="text-xs text-text-muted/70 mt-0.5">
            Last opened: {relativeTime}
          </div>
        </div>
      </div>
    </button>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

// Icons
function RadFlowLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="4" fill="currentColor" className="text-primary" />
      <path d="M10 12h12M10 16h8M10 20h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
