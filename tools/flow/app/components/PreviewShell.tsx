import { useRef, useCallback, useMemo } from "react";
import { useBridgeConnection } from "../hooks/useBridgeConnection";
import { useAppStore } from "../stores/appStore";
import type { BridgeConnectionStatus, BridgeSelection, SerializedComponentEntry } from "../stores/types";

/**
 * Connection status indicator component.
 */
function StatusIndicator({ status, version, error }: {
  status: BridgeConnectionStatus;
  version: string | null;
  error: string | null;
}) {
  const statusConfig = useMemo(() => {
    switch (status) {
      case "disconnected":
        return {
          color: "bg-gray-500",
          text: "Not connected",
        };
      case "connecting":
        return {
          color: "bg-yellow-500 animate-pulse",
          text: "Connecting...",
        };
      case "connected":
        return {
          color: "bg-green-500",
          text: `Connected${version ? ` (v${version})` : ""}`,
        };
      case "error":
        return {
          color: "bg-red-500",
          text: error || "Connection error",
        };
    }
  }, [status, version, error]);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${statusConfig.color}`}
        aria-hidden="true"
      />
      <span className="text-xs text-text-muted truncate max-w-[200px]">
        {statusConfig.text}
      </span>
    </div>
  );
}

export interface PreviewShellProps {
  /** URL of the target dev server */
  url: string;
  /** Callback when a component is selected in the iframe */
  onSelection?: (entry: SerializedComponentEntry) => void;
  /** Callback when hovering over a component */
  onHover?: (radflowId: string | null) => void;
}

/**
 * PreviewShell - iframe container for the target project with bridge connection.
 *
 * Displays the target dev server in an iframe and manages the connection
 * to the RadFlow bridge for:
 * - Component selection
 * - Hover highlighting
 * - Style injection
 *
 * Implementation: fn-5.5
 */
export function PreviewShell({ url, onSelection, onHover }: PreviewShellProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Extract origin from URL for postMessage security
  const targetOrigin = useMemo(() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }, [url]);

  // Bridge connection hook
  const {
    status,
    reconnect,
    highlightComponent,
    clearHighlight,
    injectStyle,
    clearStyles,
  } = useBridgeConnection(iframeRef, targetOrigin);

  // Store state
  const bridgeVersion = useAppStore((s) => s.bridgeVersion);
  const bridgeError = useAppStore((s) => s.bridgeError);
  const bridgeSelection = useAppStore((s) => s.bridgeSelection);
  const bridgeHoveredId = useAppStore((s) => s.bridgeHoveredId);
  const bridgeComponentLookup = useAppStore((s) => s.bridgeComponentLookup);

  // Handle selection from bridge
  const handleSelectionChange = useCallback(() => {
    if (bridgeSelection && onSelection) {
      const entry = bridgeComponentLookup.get(bridgeSelection.radflowId);
      if (entry) {
        onSelection(entry);
      }
    }
  }, [bridgeSelection, bridgeComponentLookup, onSelection]);

  // Handle hover changes
  const handleHoverChange = useCallback(() => {
    if (onHover) {
      onHover(bridgeHoveredId);
    }
  }, [bridgeHoveredId, onHover]);

  // Subscribe to selection/hover changes
  useAppStore.subscribe(
    (state) => state.bridgeSelection,
    handleSelectionChange,
  );

  useAppStore.subscribe(
    (state) => state.bridgeHoveredId,
    handleHoverChange,
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Status Bar */}
      <div className="h-8 bg-surface/50 border-b border-white/5 flex items-center justify-between px-3">
        <StatusIndicator
          status={status}
          version={bridgeVersion}
          error={bridgeError}
        />
        <div className="flex items-center gap-2">
          {status === "error" && (
            <button
              onClick={reconnect}
              className="text-xs text-primary hover:text-primary-hover px-2 py-1 rounded hover:bg-white/5"
            >
              Retry
            </button>
          )}
          {status === "connected" && (
            <span className="text-xs text-text-muted">
              {bridgeSelection ? `Selected: ${bridgeSelection.radflowId}` : "Click to select"}
            </span>
          )}
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        <iframe
          ref={iframeRef}
          src={url}
          title="Preview"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Loading/Error Overlay */}
        {(status === "disconnected" || status === "connecting") && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              {status === "connecting" ? (
                <>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-text-muted">Connecting to bridge...</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-500">!</span>
                  </div>
                  <p className="text-sm text-text-muted">Waiting for dev server...</p>
                </>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center max-w-sm p-4">
              <div className="w-8 h-8 rounded-full bg-red-500/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-red-500">!</span>
              </div>
              <p className="text-sm text-red-400 mb-2">Connection Error</p>
              <p className="text-xs text-text-muted mb-4">
                {bridgeError || "Failed to connect to bridge. Is the dev server running with @radflow/bridge installed?"}
              </p>
              <button
                onClick={reconnect}
                className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewShell;
