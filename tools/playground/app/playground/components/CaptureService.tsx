"use client";

import { useEffect } from "react";
import { parsePlaygroundSignalEvent } from "../lib/playground-signal-event";

const CAPTURE_TIMEOUT_MS = 15_000;

/**
 * Headless service component that listens for capture-request SSE events
 * and opens hidden iframes to the preview URL for screenshot capture.
 * Renders nothing visible.
 */
export function CaptureService() {
  useEffect(() => {
    const eventSource = new EventSource("/playground/api/agent/signal");

    eventSource.onmessage = (event) => {
      const parsed = parsePlaygroundSignalEvent(event.data);
      if (!parsed || parsed.type !== "capture-request") return;

      const { previewUrl, requestId } = parsed;
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;pointer-events:none;";
      iframe.src = previewUrl;
      document.body.appendChild(iframe);

      // Poll for completion
      let cleared = false;
      const cleanup = () => {
        if (cleared) return;
        cleared = true;
        clearInterval(poll);
        clearTimeout(timeout);
        iframe.remove();
      };

      const poll = setInterval(async () => {
        try {
          const res = await fetch(
            `/playground/api/agent/capture?id=${requestId}`,
          );
          const data = await res.json();
          if (data.status === "complete") cleanup();
        } catch {
          // ignore poll errors
        }
      }, 500);

      const timeout = setTimeout(cleanup, CAPTURE_TIMEOUT_MS);
    };

    return () => eventSource.close();
  }, []);

  return null;
}
