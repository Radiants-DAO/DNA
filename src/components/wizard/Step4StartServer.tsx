import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { useDevServer } from "../../hooks/useDevServer";
import type { ProjectInfo } from "../../bindings";

interface Step4StartServerProps {
  project: ProjectInfo;
  onComplete: () => void;
  onBack: () => void;
  connecting: boolean;
  setConnecting: (connecting: boolean) => void;
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

const HEALTH_CHECK_INTERVAL = 2000; // 2 seconds
const MAX_HEALTH_CHECKS = 30; // 1 minute max

/**
 * Step 4: Start Dev Server
 *
 * Starts the dev server and waits for connection to the RadFlow bridge.
 */
export function Step4StartServer({
  project,
  onComplete,
  onBack,
  connecting,
  setConnecting,
  connected,
  setConnected,
}: Step4StartServerProps) {
  const [error, setError] = useState<string | null>(null);
  const healthCheckCount = useRef(0);
  const healthCheckInterval = useRef<number | null>(null);

  const {
    serverStatus,
    serverLogs,
    startDevServer,
    stopDevServer,
    isServerHealthy,
    getServerUrl,
  } = useDevServer();

  // Detect project in app store for dev server management
  const detectProject = useAppStore((s) => s.detectProject);
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);

  // Monitor bridge connection
  useEffect(() => {
    if (bridgeStatus === "connected") {
      setConnected(true);
      setConnecting(false);
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
    }
  }, [bridgeStatus, setConnected, setConnecting]);

  // Check for health endpoint
  const checkHealth = useCallback(async () => {
    healthCheckCount.current += 1;

    if (healthCheckCount.current >= MAX_HEALTH_CHECKS) {
      setError("Timed out waiting for dev server. Please check that the server started correctly.");
      setConnecting(false);
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
        healthCheckInterval.current = null;
      }
      return;
    }

    const healthy = await isServerHealthy();
    if (healthy) {
      // Server is healthy, but we need to wait for bridge connection
      // The bridge connection will be established when the iframe loads
    }
  }, [isServerHealthy, setConnecting]);

  const handleStart = async () => {
    try {
      setError(null);
      setConnecting(true);
      healthCheckCount.current = 0;

      // Ensure project is detected in app store
      await detectProject(project.path);

      // Start the dev server
      const result = await startDevServer();

      if (!result.success) {
        setError(result.error || "Failed to start dev server");
        setConnecting(false);
        return;
      }

      // Start health check polling
      healthCheckInterval.current = window.setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start server";
      setError(message);
      setConnecting(false);
    }
  };

  const handleStop = async () => {
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
      healthCheckInterval.current = null;
    }
    await stopDevServer();
    setConnecting(false);
    setConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []);

  const isRunning = serverStatus.state === "running";
  const isStarting = serverStatus.state === "starting";
  const serverUrl = getServerUrl();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Start Dev Server</h2>
        <p className="text-text-muted text-sm">
          Start your Next.js dev server to connect RadFlow
        </p>
      </div>

      {/* Server Status */}
      <div className="bg-surface rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? "bg-green-500"
                  : isStarting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-500"
              }`}
            />
            <span className="text-sm">
              {isRunning
                ? `Running on port ${serverStatus.port}`
                : isStarting
                ? "Starting..."
                : "Stopped"}
            </span>
          </div>
          <span className="text-xs text-text-muted font-mono">
            {project.devCommand}
          </span>
        </div>

        {/* Connection Status */}
        {(isRunning || connecting) && (
          <div className="flex items-center gap-2 py-2 px-3 bg-white/5 rounded">
            {connected ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">Connected! RadFlow is ready.</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-muted">Waiting for bridge connection...</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Server Logs */}
      {serverLogs.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-white/10 overflow-hidden">
          <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Server Output</span>
            {isStarting && (
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-0.5">
            {serverLogs.slice(-50).map((log, i) => (
              <div
                key={i}
                className={log.isError ? "text-red-400" : "text-text-muted"}
              >
                {log.line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success State */}
      {connected && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
          <CheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-400 font-medium">Setup Complete!</p>
          <p className="text-sm text-text-muted mt-1">
            RadFlow is now connected to your project at {serverUrl}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isStarting}
          className="text-text-muted hover:text-text px-4 py-2 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex gap-3">
          {!isRunning && !connected && (
            <button
              onClick={handleStart}
              disabled={connecting}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting ? "Starting..." : "Start Dev Server"}
            </button>
          )}
          {isRunning && !connected && (
            <button
              onClick={handleStop}
              className="bg-surface hover:bg-surface-hover text-text px-6 py-2 rounded-lg border border-white/10 transition-colors"
            >
              Stop
            </button>
          )}
          {connected && (
            <button
              onClick={onComplete}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Open Editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
