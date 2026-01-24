import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import type { RadflowId, SourceLocation, SerializedComponentEntry } from "../stores/types";

/**
 * Bridge Message Types
 * Mirror of types from @rdna/bridge
 */
type HostMessage =
  | { type: "PING" }
  | { type: "GET_COMPONENT_MAP" }
  | { type: "HIGHLIGHT"; radflowId: RadflowId }
  | { type: "CLEAR_HIGHLIGHT" }
  | { type: "INJECT_STYLE"; css: string }
  | { type: "CLEAR_STYLES" };

type BridgeMessage =
  | { type: "PONG"; version: string }
  | { type: "COMPONENT_MAP"; entries: SerializedComponentEntry[] }
  | { type: "SELECTION"; radflowId: RadflowId; source: SourceLocation | null; fallbackSelectors: string[] }
  | { type: "HOVER"; radflowId: RadflowId | null }
  | { type: "ERROR"; message: string };

/** Handshake timeout in ms */
const HANDSHAKE_TIMEOUT = 2000;

/** Reconnect base delay in ms */
const RECONNECT_BASE_DELAY = 500;

/** Max reconnect attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Hook for managing connection to the RadFlow bridge in an iframe.
 *
 * Handles:
 * - Handshake (PING/PONG)
 * - Automatic reconnection on navigation/refresh
 * - Message routing to store
 * - Sending commands to bridge
 *
 * @param iframeRef - Ref to the iframe element containing the target app
 * @param targetOrigin - Origin of the target dev server (e.g., "http://localhost:3000")
 */
export function useBridgeConnection(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  targetOrigin: string
) {
  const handshakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store actions
  const setBridgeStatus = useAppStore((s) => s.setBridgeStatus);
  const setBridgeConnected = useAppStore((s) => s.setBridgeConnected);
  const setBridgeError = useAppStore((s) => s.setBridgeError);
  const setBridgeDisconnected = useAppStore((s) => s.setBridgeDisconnected);
  const incrementReconnectAttempts = useAppStore((s) => s.incrementReconnectAttempts);
  const updateBridgeComponentMap = useAppStore((s) => s.updateBridgeComponentMap);
  const setBridgeSelection = useAppStore((s) => s.setBridgeSelection);
  const setBridgeHoveredId = useAppStore((s) => s.setBridgeHoveredId);

  // Store state for reconnect logic
  const reconnectAttempts = useAppStore((s) => s.reconnectAttempts);
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);

  /**
   * Send a message to the bridge iframe.
   */
  const sendMessage = useCallback(
    (message: HostMessage) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        console.warn("[useBridgeConnection] No iframe to send message to");
        return false;
      }

      try {
        iframe.contentWindow.postMessage(message, targetOrigin);
        return true;
      } catch (err) {
        console.error("[useBridgeConnection] Failed to send message:", err);
        return false;
      }
    },
    [iframeRef, targetOrigin]
  );

  /**
   * Handle incoming messages from the bridge.
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== targetOrigin) {
        return;
      }

      const message = event.data as BridgeMessage;
      if (!message || typeof message.type !== "string") {
        return;
      }

      switch (message.type) {
        case "PONG":
          // Handshake complete
          if (handshakeTimeoutRef.current) {
            clearTimeout(handshakeTimeoutRef.current);
            handshakeTimeoutRef.current = null;
          }
          setBridgeConnected(message.version);
          console.log(`[useBridgeConnection] Connected to bridge v${message.version}`);
          // Request initial componentMap
          sendMessage({ type: "GET_COMPONENT_MAP" });
          break;

        case "COMPONENT_MAP":
          updateBridgeComponentMap(message.entries);
          break;

        case "SELECTION":
          setBridgeSelection({
            radflowId: message.radflowId,
            source: message.source,
            fallbackSelectors: message.fallbackSelectors,
          });
          break;

        case "HOVER":
          setBridgeHoveredId(message.radflowId);
          break;

        case "ERROR":
          console.error("[useBridgeConnection] Bridge error:", message.message);
          setBridgeError(message.message);
          break;

        default:
          console.warn(
            "[useBridgeConnection] Unknown message type:",
            (message as { type: string }).type
          );
      }
    },
    [
      targetOrigin,
      setBridgeConnected,
      setBridgeError,
      updateBridgeComponentMap,
      setBridgeSelection,
      setBridgeHoveredId,
      sendMessage,
    ]
  );

  /**
   * Initiate handshake with the bridge.
   */
  const startHandshake = useCallback(() => {
    setBridgeStatus("connecting");

    // Clear any existing timeout
    if (handshakeTimeoutRef.current) {
      clearTimeout(handshakeTimeoutRef.current);
    }

    // Send PING
    const sent = sendMessage({ type: "PING" });
    if (!sent) {
      setBridgeError("Failed to send PING to bridge");
      return;
    }

    // Set timeout for handshake
    handshakeTimeoutRef.current = setTimeout(() => {
      const currentStatus = useAppStore.getState().bridgeStatus;
      if (currentStatus === "connecting") {
        console.warn("[useBridgeConnection] Handshake timed out");
        setBridgeError("Handshake timed out - bridge may not be installed");
        scheduleReconnect();
      }
    }, HANDSHAKE_TIMEOUT);
  }, [sendMessage, setBridgeStatus, setBridgeError]);

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  const scheduleReconnect = useCallback(() => {
    const attempts = useAppStore.getState().reconnectAttempts;

    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(
        "[useBridgeConnection] Max reconnect attempts reached, giving up"
      );
      setBridgeError("Failed to connect after multiple attempts");
      return;
    }

    incrementReconnectAttempts();

    // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, attempts);
    console.log(
      `[useBridgeConnection] Scheduling reconnect in ${delay}ms (attempt ${attempts + 1})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      startHandshake();
    }, delay);
  }, [incrementReconnectAttempts, setBridgeError, startHandshake]);

  /**
   * Handle iframe load event (navigation/refresh).
   */
  const handleIframeLoad = useCallback(() => {
    console.log("[useBridgeConnection] Iframe loaded, starting handshake");
    // Reset connection state
    setBridgeDisconnected();
    // Start handshake after a small delay to let the bridge initialize
    setTimeout(startHandshake, 100);
  }, [setBridgeDisconnected, startHandshake]);

  // Set up message listener
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  // Set up iframe load listener
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.addEventListener("load", handleIframeLoad);

    // If iframe is already loaded, start handshake
    if (iframe.contentDocument?.readyState === "complete") {
      handleIframeLoad();
    }

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
    };
  }, [iframeRef, handleIframeLoad]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setBridgeDisconnected();
    };
  }, [setBridgeDisconnected]);

  // Return API for component use
  return {
    /** Current connection status */
    status: bridgeStatus,

    /** Manually trigger reconnect */
    reconnect: startHandshake,

    /** Request componentMap update */
    requestComponentMap: useCallback(
      () => sendMessage({ type: "GET_COMPONENT_MAP" }),
      [sendMessage]
    ),

    /** Highlight a component in the iframe */
    highlightComponent: useCallback(
      (radflowId: RadflowId) => sendMessage({ type: "HIGHLIGHT", radflowId }),
      [sendMessage]
    ),

    /** Clear highlight */
    clearHighlight: useCallback(
      () => sendMessage({ type: "CLEAR_HIGHLIGHT" }),
      [sendMessage]
    ),

    /** Inject CSS into the iframe */
    injectStyle: useCallback(
      (css: string) => sendMessage({ type: "INJECT_STYLE", css }),
      [sendMessage]
    ),

    /** Clear injected styles */
    clearStyles: useCallback(
      () => sendMessage({ type: "CLEAR_STYLES" }),
      [sendMessage]
    ),
  };
}
