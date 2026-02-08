import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { sendToContent } from "../api/contentBridge";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  column: number;
  props?: Record<string, unknown>;
}

/**
 * Component ID Mode overlay - Extension version
 *
 * Features:
 * - Cursor changes to crosshair
 * - Element pills show component names on hover
 * - Single click copies location to clipboard
 * - Shift+Click adds to selection (multi-select)
 * - Click+Drag rectangle selection
 * - Toast confirms copy
 * - Right-click shows hierarchy context menu
 *
 * Note: Uses content bridge messaging for DOM interaction.
 */
export function ComponentIdMode() {
  const editorMode = useAppStore((s) => s.editorMode);

  const componentIdMode = editorMode === "component-id";

  const [copiedComponent, setCopiedComponent] = useState<ComponentInfo | null>(null);

  // Format clipboard text for single component
  const formatClipboardText = (component: ComponentInfo): string => {
    const fileName = component.file.split("/").pop() || component.file;
    return `${component.name} @ ${fileName}:${component.line}`;
  };

  // Copy to clipboard with toast
  const copyToClipboard = useCallback(
    async (component: ComponentInfo) => {
      const text = formatClipboardText(component);
      try {
        await navigator.clipboard.writeText(text);
        setCopiedComponent(component);
        setTimeout(() => setCopiedComponent(null), 2000);
      } catch (err) {
        console.error("[ComponentIdMode] Failed to copy to clipboard:", err);
      }
    },
    []
  );

  // DOM interaction (hover tooltips, click-to-copy) is handled by the content script
  // via panel:feature messages. The panel only manages mode state and displays UI indicators.

  // Send mode state to content script
  useEffect(() => {
    if (componentIdMode) {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "component-id", action: "activate" },
      });
    } else {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "component-id", action: "deactivate" },
      });
    }
  }, [componentIdMode]);

  if (!componentIdMode) return null;

  return (
    <DogfoodBoundary name="ComponentIdMode" file="ComponentIdMode.tsx" category="mode">
      <>
        {/* Copy Toast */}
        {copiedComponent && (
          <div
            data-radflow-panel
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="font-semibold text-sm">Copied to clipboard!</div>
              <div className="text-white/80 text-xs font-mono mt-1 max-w-md truncate">
                {formatClipboardText(copiedComponent)}
              </div>
            </div>
          </div>
        )}

        {/* Mode Indicator */}
        <div
          data-radflow-panel
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
        >
          <div className="bg-blue-600/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
            Component ID Mode
          </div>
        </div>
      </>
    </DogfoodBoundary>
  );
}
