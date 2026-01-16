import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { commands } from "../../bindings";
import type { ProjectInfo } from "../../bindings";

interface Step1SelectProjectProps {
  onProjectSelected: (project: ProjectInfo) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * Step 1: Select Project
 *
 * File picker dialog for project folder with validation.
 * Must contain package.json with `next` dependency.
 */
export function Step1SelectProject({
  onProjectSelected,
  error,
  setError,
  loading,
  setLoading,
}: Step1SelectProjectProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  const handleSelectFolder = async () => {
    try {
      setError(null);
      setLoading(true);

      const selected = await open({
        multiple: false,
        directory: true,
        title: "Select Next.js Project Folder",
      });

      if (!selected) {
        setLoading(false);
        return; // User cancelled
      }

      const path = typeof selected === "string" ? selected : selected[0];
      const result = await commands.detectProject(path);

      if (!result.success || !result.project) {
        setError(result.error || "Failed to detect project");
        setLoading(false);
        return;
      }

      if (result.project.projectType !== "nextjs") {
        setError("No Next.js project found. Please select a folder containing package.json with 'next' as a dependency.");
        setLoading(false);
        return;
      }

      setSelectedProject(result.project);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select project");
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedProject) {
      onProjectSelected(selectedProject);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Select Your Project</h2>
        <p className="text-text-muted text-sm">
          Choose a Next.js project folder to connect with RadFlow
        </p>
      </div>

      {/* Select Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSelectFolder}
          disabled={loading}
          className="flex items-center gap-3 bg-surface hover:bg-surface-hover px-6 py-4 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
        >
          <FolderIcon />
          <span>{loading ? "Detecting..." : "Choose Project Folder"}</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Selected Project Info */}
      {selectedProject && (
        <div className="p-4 bg-surface rounded-lg border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <CheckIcon className="text-green-500" />
            <span className="font-medium">Next.js project detected</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-muted">Name:</span>
              <span className="ml-2">{selectedProject.name}</span>
            </div>
            <div>
              <span className="text-text-muted">Next.js:</span>
              <span className="ml-2">{selectedProject.nextVersion || "unknown"}</span>
            </div>
            <div>
              <span className="text-text-muted">Package Manager:</span>
              <span className="ml-2 capitalize">{selectedProject.packageManager}</span>
            </div>
            <div>
              <span className="text-text-muted">Dev Port:</span>
              <span className="ml-2">{selectedProject.devPort}</span>
            </div>
          </div>
          <div className="text-xs text-text-muted truncate">
            {selectedProject.path}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedProject && (
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
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

function CheckIcon({ className = "" }: { className?: string }) {
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
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
