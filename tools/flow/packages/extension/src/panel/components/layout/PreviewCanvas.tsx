/**
 * PreviewCanvas - Placeholder for inspected tab preview
 *
 * In the DevTools extension context, the real page lives in the inspected tab,
 * not in an iframe. This component shows a placeholder explaining this.
 *
 * The actual inspection and mutation happens via content script messaging.
 */

import { useAppStore } from "../../stores/appStore";

interface PreviewCanvasProps {
  previewBg?: "dark" | "light";
}

export function PreviewCanvas({ previewBg = "dark" }: PreviewCanvasProps) {
  const editorMode = useAppStore((s) => s.editorMode);

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center ${
        previewBg === "dark" ? "bg-neutral-900" : "bg-neutral-100"
      }`}
      data-devflow-id="preview-canvas"
    >
      <div className="text-center max-w-md px-6">
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            previewBg === "dark" ? "bg-neutral-800" : "bg-neutral-200"
          }`}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={previewBg === "dark" ? "text-neutral-400" : "text-neutral-600"}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>

        <h2
          className={`text-lg font-medium mb-2 ${
            previewBg === "dark" ? "text-neutral-200" : "text-neutral-800"
          }`}
        >
          Inspecting Active Tab
        </h2>

        <p
          className={`text-sm mb-4 ${
            previewBg === "dark" ? "text-neutral-400" : "text-neutral-600"
          }`}
        >
          The live preview is in the browser tab you're inspecting. Use the
          DevTools panel to select and edit elements directly in the page.
        </p>

        <div
          className={`text-xs font-mono px-3 py-2 rounded-md ${
            previewBg === "dark"
              ? "bg-neutral-800 text-neutral-400"
              : "bg-neutral-200 text-neutral-600"
          }`}
        >
          Mode: <span className="text-blue-400">{editorMode}</span>
        </div>
      </div>
    </div>
  );
}

export default PreviewCanvas;
