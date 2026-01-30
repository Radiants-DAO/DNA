import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Book, Settings, HelpCircle } from "./ui/icons";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../stores/appStore";
import type { RecentWorkspace } from "../stores/slices/workspaceSlice";

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
  const recentWorkspaces = useAppStore((s) => s.recentWorkspaces);
  const workspaceLoading = useAppStore((s) => s.workspaceLoading);
  const workspaceError = useAppStore((s) => s.workspaceError);
  const openWorkspace = useAppStore((s) => s.openWorkspace);
  const removeRecentWorkspace = useAppStore((s) => s.removeRecentWorkspace);

  // Keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; workspace: RecentWorkspace } | null>(null);
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

      const maxIndex = recentWorkspaces.length - 1;

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
            openWorkspace(recentWorkspaces[selectedIndex].path);
          } else if (selectedIndex === -1) {
            openWorkspace();
          }
          break;
        case "Escape":
          setSelectedIndex(-1);
          break;
      }
    },
    [recentWorkspaces, selectedIndex, openWorkspace, contextMenu]
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

  const handleContextMenu = (e: React.MouseEvent, workspace: RecentWorkspace) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, workspace });
  };

  const handleRemoveFromRecents = () => {
    if (contextMenu) {
      removeRecentWorkspace(contextMenu.workspace.path);
      setContextMenu(null);
    }
  };

  const handleOpenInFinder = async () => {
    if (contextMenu) {
      try {
        await revealItemInDir(contextMenu.workspace.path);
      } catch (err) {
        console.error("Failed to open in Finder:", err);
      }
      setContextMenu(null);
    }
  };

  const handleQuickAction = async (action: "docs" | "settings" | "help") => {
    const urls: Record<string, string> = {
      docs: "https://tauri.app/v2/guides/",
      settings: "#settings",
      help: "https://github.com/anthropics/claude-code/issues",
    };

    if (action === "settings") {
      console.log("Settings panel coming soon");
      return;
    }

    try {
      await openUrl(urls[action]);
    } catch (err) {
      console.error(`Failed to open ${action}:`, err);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        <div data-tauri-drag-region className="h-10 flex-shrink-0 select-none" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Drag region for window */}
      <div data-tauri-drag-region className="h-10 flex-shrink-0 select-none" />

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
            onClick={() => openWorkspace()}
            className={`w-full bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 ${
              selectedIndex === -1 ? "ring-2 ring-primary/50" : ""
            }`}
          >
            <FolderIcon />
            Open Project
          </button>

          {/* Error display */}
          {workspaceError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{workspaceError}</p>
            </div>
          )}

          {/* Recent Workspaces */}
          {recentWorkspaces.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-text-muted mb-3">Recent Workspaces</h2>
              <div ref={listRef} className="space-y-1 max-h-64 overflow-y-auto">
                {recentWorkspaces.map((ws, index) => (
                  <RecentWorkspaceItem
                    key={ws.path}
                    workspace={ws}
                    isSelected={selectedIndex === index}
                    onSelect={() => openWorkspace(ws.path)}
                    onContextMenu={(e) => handleContextMenu(e, ws)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-8">
              <div className="text-text-muted mb-2">No recent workspaces</div>
              <p className="text-sm text-text-muted/70">
                Open a pnpm monorepo to get started
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
                icon={<Book className="w-[18px] h-[18px]" />}
                label="Documentation"
                onClick={() => handleQuickAction("docs")}
              />
              <QuickActionButton
                icon={<Settings className="w-[18px] h-[18px]" />}
                label="Settings"
                onClick={() => handleQuickAction("settings")}
              />
              <QuickActionButton
                icon={<HelpCircle className="w-[18px] h-[18px]" />}
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

interface RecentWorkspaceItemProps {
  workspace: RecentWorkspace;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
}

function RecentWorkspaceItem({
  workspace,
  isSelected,
  onSelect,
  onContextMenu,
  onMouseEnter,
}: RecentWorkspaceItemProps) {
  const displayPath = shortenPath(workspace.path);
  const relativeTime = formatRelativeTime(workspace.lastOpened);

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
          <div className="font-medium text-text truncate">{workspace.name}</div>
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
