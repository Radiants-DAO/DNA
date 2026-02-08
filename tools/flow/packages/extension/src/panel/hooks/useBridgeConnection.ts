/**
 * useBridgeConnection - Adapted for Chrome Extension
 *
 * Ported from Flow 0 - Originally used iframe postMessage for Tauri.
 * Now uses Chrome extension messaging via contentBridge.
 *
 * This is a compatibility layer that provides a similar API to the original
 * useBridgeConnection hook, but internally uses the extension's messaging system.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  initContentBridge,
  sendToContent,
  onContentMessage,
  disconnectContentBridge,
} from "../api/contentBridge";

/** Bridge connection status */
export type BridgeStatus = "disconnected" | "connecting" | "connected" | "error";

/** Component entry from content script */
export interface SerializedComponentEntry {
  radflowId: string;
  componentName: string;
  selector: string;
  source: { file: string; line: number; column: number } | null;
  fallbackSelectors: string[];
}

/** Selection data from content script */
export interface BridgeSelection {
  radflowId: string;
  source: { file: string; line: number; column: number } | null;
  fallbackSelectors: string[];
}

interface UseBridgeConnectionOptions {
  /** The tab ID to communicate with */
  tabId: number;
  /** Callback when component map is updated */
  onComponentMapUpdate?: (entries: SerializedComponentEntry[]) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selection: BridgeSelection | null) => void;
  /** Callback when hover changes */
  onHoverChange?: (radflowId: string | null) => void;
}

/**
 * Hook for managing connection to the content script via Chrome extension messaging.
 *
 * Provides a similar API to the original useBridgeConnection for Tauri iframe,
 * but uses Chrome extension messaging internally.
 */
export function useBridgeConnection(options: UseBridgeConnectionOptions) {
  const { tabId, onComponentMapUpdate, onSelectionChange, onHoverChange } = options;

  const [status, setStatus] = useState<BridgeStatus>("disconnected");
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Store callbacks in refs for stability
  const onComponentMapUpdateRef = useRef(onComponentMapUpdate);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onHoverChangeRef = useRef(onHoverChange);

  useEffect(() => {
    onComponentMapUpdateRef.current = onComponentMapUpdate;
    onSelectionChangeRef.current = onSelectionChange;
    onHoverChangeRef.current = onHoverChange;
  }, [onComponentMapUpdate, onSelectionChange, onHoverChange]);

  /**
   * Handle incoming messages from content script
   */
  const handleMessage = useCallback((message: unknown) => {
    if (!message || typeof message !== "object") return;

    const msg = message as Record<string, unknown>;

    switch (msg.type) {
      case "content:pong":
        setStatus("connected");
        break;

      case "content:component-map":
        if (Array.isArray(msg.entries)) {
          onComponentMapUpdateRef.current?.(msg.entries as SerializedComponentEntry[]);
        }
        break;

      case "content:selection":
        if (msg.radflowId) {
          onSelectionChangeRef.current?.({
            radflowId: msg.radflowId as string,
            source: msg.source as BridgeSelection["source"],
            fallbackSelectors: (msg.fallbackSelectors as string[]) || [],
          });
        } else {
          onSelectionChangeRef.current?.(null);
        }
        break;

      case "content:hover":
        onHoverChangeRef.current?.((msg.radflowId as string) || null);
        break;

      case "content:error":
        console.error("[useBridgeConnection] Content error:", msg.message);
        setStatus("error");
        break;
    }
  }, []);

  /**
   * Initialize connection
   */
  const connect = useCallback(() => {
    setStatus("connecting");
    initContentBridge(tabId);

    // Set up message listener
    cleanupRef.current = onContentMessage(handleMessage);

    // Send ping to check connection
    sendToContent({ type: "panel:ping" });

    // Set connected after a short delay if no error
    reconnectTimeoutRef.current = setTimeout(() => {
      setStatus((current) => (current === "connecting" ? "connected" : current));
    }, 500);
  }, [tabId, handleMessage]);

  /**
   * Disconnect
   */
  const disconnect = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    disconnectContentBridge();
    setStatus("disconnected");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // ============================================================================
  // Public API - matches original useBridgeConnection interface
  // ============================================================================

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  const requestComponentMap = useCallback(() => {
    sendToContent({ type: "panel:get-component-map" });
  }, []);

  const highlightComponent = useCallback((radflowId: string) => {
    sendToContent({ type: "panel:highlight", payload: { radflowId } });
  }, []);

  const clearHighlight = useCallback(() => {
    sendToContent({ type: "panel:clear-highlight" });
  }, []);

  const injectStyle = useCallback((css: string) => {
    sendToContent({ type: "panel:inject-style", payload: { css } });
    return true;
  }, []);

  const clearStyles = useCallback(() => {
    sendToContent({ type: "panel:clear-styles" });
    return true;
  }, []);

  return {
    /** Current connection status */
    status,

    /** Manually trigger reconnect */
    reconnect,

    /** Request componentMap update */
    requestComponentMap,

    /** Highlight a component in the page */
    highlightComponent,

    /** Clear highlight */
    clearHighlight,

    /** Inject CSS into the page */
    injectStyle,

    /** Clear injected styles */
    clearStyles,
  };
}
