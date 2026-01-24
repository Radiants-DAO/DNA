import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../stores/appStore";
import type { TargetProject } from "../stores/types";

/**
 * TargetProjectSelector - Dropdown for selecting which dev server to connect to
 *
 * Features:
 * - Scans for RadFlow-enabled projects on startup
 * - Shows available/running servers
 * - Changes the active target which updates the preview iframe
 * - Manual refresh button
 */
export function TargetProjectSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const targetProjects = useAppStore((s) => s.targetProjects);
  const activeTarget = useAppStore((s) => s.activeTarget);
  const isScanning = useAppStore((s) => s.isScanning);
  const scanForProjects = useAppStore((s) => s.scanForProjects);
  const setActiveTarget = useAppStore((s) => s.setActiveTarget);
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);

  // Scan for projects on mount
  useEffect(() => {
    scanForProjects();
  }, [scanForProjects]);

  // Update target URL when active target changes
  useEffect(() => {
    setTargetUrl(activeTarget?.url || null);
  }, [activeTarget, setTargetUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (project: TargetProject) => {
    setActiveTarget(project);
    setIsOpen(false);
  };

  const StatusDot = ({ status }: { status: TargetProject["status"] }) => (
    <span
      className={`w-2 h-2 rounded-full ${
        status === "online"
          ? "bg-green-500"
          : status === "checking"
            ? "bg-yellow-500 animate-pulse"
            : "bg-red-500"
      }`}
    />
  );

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-7 bg-background/50 border border-white/8 rounded-md px-3 text-xs hover:border-white/15 transition-colors"
        aria-label={activeTarget ? `Target project: ${activeTarget.name}:${activeTarget.port}` : "Select target project"}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {activeTarget ? (
          <>
            <StatusDot status={activeTarget.status} />
            <span className="text-text max-w-32 truncate">
              {activeTarget.name}
            </span>
            <span className="text-text-muted">:{activeTarget.port}</span>
          </>
        ) : (
          <span className="text-text-muted">
            {isScanning ? "Scanning..." : "No project"}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-xs text-text-muted">Target Projects</span>
            <button
              onClick={() => scanForProjects()}
              disabled={isScanning}
              className="p-1 text-text-muted hover:text-text rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg
                className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Project list */}
          <div className="max-h-60 overflow-y-auto">
            {targetProjects.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-muted text-center">
                {isScanning ? (
                  <span>Scanning ports...</span>
                ) : (
                  <span>
                    No RadFlow-enabled projects found.
                    <br />
                    Start a dev server to connect.
                  </span>
                )}
              </div>
            ) : (
              targetProjects.map((project) => (
                <button
                  key={project.url}
                  onClick={() => handleSelect(project)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                    activeTarget?.url === project.url ? "bg-white/5" : ""
                  }`}
                >
                  <StatusDot status={project.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text truncate">
                      {project.name}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      localhost:{project.port}
                    </div>
                  </div>
                  {activeTarget?.url === project.url && (
                    <svg
                      className="w-3.5 h-3.5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TargetProjectSelector;
