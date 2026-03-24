"use client";

import { useEffect, useRef } from "react";

const CAPTURE_TIMEOUT_MS = 15_000;

/**
 * Event name dispatched by PlaygroundCanvas when a capture-request
 * signal arrives via the shared SSE connection.
 */
export const CAPTURE_REQUEST_EVENT = "playground:capture-request";

export interface CaptureRequestDetail {
  previewUrl: string;
  requestId: string;
}

/**
 * Headless service component that handles capture-request events by
 * opening hidden iframes to the preview URL for screenshot capture.
 * Iframes self-report completion via postMessage; timeout cleans up
 * stale iframes after 15s. No SSE connection of its own — listens
 * for CustomEvents dispatched by PlaygroundCanvas.
 *
 * Renders nothing visible.
 */
export function CaptureService() {
  const activeIframes = useRef(new Map<string, HTMLIFrameElement>());

  useEffect(() => {
    // Listen for postMessage from capture iframes reporting completion
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type !== "capture-complete") return;
      const requestId = event.data.requestId as string;
      const iframe = activeIframes.current.get(requestId);
      if (iframe) {
        iframe.remove();
        activeIframes.current.delete(requestId);
      }
    };

    // Listen for capture-request CustomEvents from the signal handler
    const captureHandler = (event: Event) => {
      const { previewUrl, requestId } = (event as CustomEvent<CaptureRequestDetail>).detail;

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
    };

    window.addEventListener("message", messageHandler);
    document.addEventListener(CAPTURE_REQUEST_EVENT, captureHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
      document.removeEventListener(CAPTURE_REQUEST_EVENT, captureHandler);
      // Clean up any remaining iframes
      for (const iframe of activeIframes.current.values()) {
        iframe.remove();
      }
      activeIframes.current.clear();
    };
  }, []);

  return null;
}
