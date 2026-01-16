import { useState, useCallback } from "react";
import type { ProjectInfo } from "../../bindings";

interface Step2InstallBridgeProps {
  project: ProjectInfo;
  onComplete: () => void;
  onBack: () => void;
  progress: string[];
  addProgress: (line: string) => void;
  complete: boolean;
  setComplete: (complete: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Step 2: Install Bridge
 *
 * Shows commands that will run for bridge installation.
 * For now, shows instructions for manual installation until
 * we have the shell plugin configured.
 */
export function Step2InstallBridge({
  project,
  onComplete,
  onBack,
  progress,
  addProgress,
  complete,
  setComplete,
  error,
  setError,
}: Step2InstallBridgeProps) {
  const [confirmed, setConfirmed] = useState(false);

  // Get the install command based on package manager
  const getInstallCommand = useCallback(() => {
    switch (project.packageManager) {
      case "pnpm":
        return "pnpm add -D file:.radflow/bridge";
      case "yarn":
        return "yarn add -D file:.radflow/bridge";
      case "npm":
      default:
        return "npm install -D file:.radflow/bridge";
    }
  }, [project.packageManager]);

  const installCommand = getInstallCommand();

  const handleConfirmToggle = useCallback(() => {
    const newConfirmed = !confirmed;
    setConfirmed(newConfirmed);
    setComplete(newConfirmed);
  }, [confirmed, setComplete]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  // If project already has bridge installed, skip this step
  if (project.hasBridge) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Bridge Already Installed</h2>
          <p className="text-text-muted text-sm">
            The RadFlow bridge is already installed in this project
          </p>
        </div>

        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckIcon className="text-green-500" />
          <span className="text-green-400 text-sm">Bridge detected at .radflow/bridge/</span>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-text-muted hover:text-text px-4 py-2 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onComplete}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Install Bridge</h2>
        <p className="text-text-muted text-sm">
          Run these commands in your project directory
        </p>
      </div>

      {/* Commands to Run */}
      <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
        <div className="px-4 py-2 bg-white/5 border-b border-white/10">
          <span className="text-xs text-text-muted font-medium">Terminal Commands</span>
        </div>
        <div className="p-4 space-y-4">
          {/* Step 1: Copy bridge */}
          <div>
            <div className="text-xs text-text-muted mb-1">1. Copy bridge package:</div>
            <div className="bg-gray-900 rounded px-3 py-2 font-mono text-sm flex items-center justify-between">
              <code className="text-text">mkdir -p .radflow/bridge</code>
              <button
                onClick={() => handleCopy("mkdir -p .radflow/bridge")}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Step 2: Install */}
          <div>
            <div className="text-xs text-text-muted mb-1">2. Install the bridge:</div>
            <div className="bg-gray-900 rounded px-3 py-2 font-mono text-sm flex items-center justify-between">
              <code className="text-primary">{installCommand}</code>
              <button
                onClick={() => handleCopy(installCommand)}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Step 3: Update gitignore */}
          <div>
            <div className="text-xs text-text-muted mb-1">3. Add to .gitignore:</div>
            <div className="bg-gray-900 rounded px-3 py-2 font-mono text-sm flex items-center justify-between">
              <code className="text-text">echo ".radflow/" &gt;&gt; .gitignore</code>
              <button
                onClick={() => handleCopy('echo ".radflow/" >> .gitignore')}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Note about automatic installation */}
      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-xs">
          Note: Automatic installation will be available in a future update.
          For now, please run these commands manually in your terminal.
        </p>
      </div>

      {/* Confirmation Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface rounded-lg border border-white/10 hover:bg-surface-hover transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={handleConfirmToggle}
          className="w-4 h-4 rounded border-white/20 bg-background text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span className="text-sm">I've installed the bridge package</span>
      </label>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text px-4 py-2 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!confirmed}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
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
