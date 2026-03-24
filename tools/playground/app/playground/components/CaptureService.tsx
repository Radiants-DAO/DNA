"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PlaygroundSignalEvent } from "../api/agent/signal-store";

const CAPTURE_TIMEOUT_MS = 15_000;

/**
 * Headless service component that handles capture-request events by
 * opening hidden iframes to the preview URL for screenshot capture.
 * Iframes self-report completion via postMessage; timeout cleans up
 * stale iframes after 15s.
 *
 * Renders nothing visible.
 */
export function CaptureService() {
  const activeIframes = useRef(new Map<string, HTMLIFrameElement>());

  // Listen for postMessage from capture iframes
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "capture-complete") return;
      const requestId = event.data.requestId as string;
      const iframe = activeIframes.current.get(requestId);
      if (iframe) {
        iframe.remove();
        activeIframes.current.delete(requestId);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleCaptureRequest = useCallback(
    (previewUrl: string, requestId: string) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;pointer-events:none;";
      iframe.src = previewUrl;
      document.body.appendChild(iframe);
      activeIframes.current.set(requestId, iframe);

      // Timeout safety net
      setTimeout(() => {
        if (activeIframes.current.has(requestId)) {
          activeIframes.current.get(requestId)?.remove();
          activeIframes.current.delete(requestId);
        }
      }, CAPTURE_TIMEOUT_MS);
    },
    [],
  );

  // Expose handler for signal events
  useEffect(() => {
    // Store the handler on window so PlaygroundCanvas can dispatch to it
    // without a second SSE connection
    (window as unknown as Record<string, unknown>).__captureHandler = (
      event: PlaygroundSignalEvent,
    ) => {
      if (event.type === "capture-request") {
        handleCaptureRequest(event.previewUrl, event.requestId);
      }
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__captureHandler;
    };
  }, [handleCaptureRequest]);

  return null;
}
