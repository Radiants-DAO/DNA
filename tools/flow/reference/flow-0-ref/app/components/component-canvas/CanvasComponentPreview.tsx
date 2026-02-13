import { useRef, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

/**
 * Feature detection for iframe credentialless attribute
 */
const supportsCredentialless =
  typeof HTMLIFrameElement !== "undefined" &&
  "credentialless" in HTMLIFrameElement.prototype;

interface CanvasComponentPreviewProps {
  /** Component name to render */
  componentName: string;
  /** Node ID for state tracking */
  nodeId: string;
  /** Preview server URL */
  serverUrl: string;
  /** Width of the preview area */
  width: number;
  /** Height of the preview area */
  height: number;
}

/**
 * CanvasComponentPreview renders a single component in an iframe.
 *
 * Uses a URL convention: `{serverUrl}/{previewRoute}?name={componentName}`
 * The target app's dev server needs a route that renders a component
 * in isolation. Falls back to showing the component name.
 *
 * Based on PreviewCanvas iframe pattern with security upgrades.
 */
export function CanvasComponentPreview({
  componentName,
  nodeId,
  serverUrl,
  width,
  height,
}: CanvasComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setNodePreviewLoaded = useAppStore((s) => s.setNodePreviewLoaded);
  const previewRoute = useAppStore((s) => {
    const ws = s.workspace;
    if (!ws || !ws.activeAppId) return "/preview-component";
    const app = ws.apps.find((a) => a.id === ws.activeAppId);
    return app?.previewRoute ?? "/preview-component";
  });

  // Build preview URL
  const previewUrl = `${serverUrl}${previewRoute}?name=${encodeURIComponent(componentName)}`;

  const handleLoad = useCallback(() => {
    setNodePreviewLoaded(nodeId, true);
  }, [nodeId, setNodePreviewLoaded]);

  const handleError = useCallback(() => {
    setNodePreviewLoaded(nodeId, false);
  }, [nodeId, setNodePreviewLoaded]);

  return (
    <div
      className="relative overflow-hidden rounded bg-white"
      style={{ width, height }}
    >
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0"
        title={`Preview: ${componentName}`}
        {...(supportsCredentialless && { credentialless: "true" })}
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleLoad}
        onError={handleError}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

export default CanvasComponentPreview;
