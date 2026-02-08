import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { sendToContent } from "../api/contentBridge";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

interface PendingEdit {
  componentName: string;
  file: string;
  line: number;
  originalText: string;
  newText: string;
}

/**
 * Text Edit Mode overlay - Extension version
 *
 * Features:
 * - T key toggles Text Edit mode (via parent keyboard handling)
 * - Text elements become contentEditable on click
 * - Rich text support: bold (Cmd+B), italic (Cmd+I)
 * - Edits accumulate in local state
 * - Esc exits mode and copies all edits to clipboard
 * - Toast shows change count on exit
 *
 * Note: Uses content bridge messaging for DOM interaction in inspected page.
 */
export function TextEditMode() {
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);

  // Text edit mode is active when editorMode is "text-edit" (set by toolbar)
  const textEditActive = editorMode === "text-edit";
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([]);
  const [showExitToast, setShowExitToast] = useState(false);
  const [exitEditCount, setExitEditCount] = useState(0);

  // Handle Escape to exit text edit mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && textEditActive) {
        e.preventDefault();
        e.stopPropagation();

        // Copy all changes to clipboard and exit mode
        const editCount = pendingEdits.length;
        if (editCount > 0) {
          copyEditsToClipboard(pendingEdits);
          setExitEditCount(editCount);
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 3000);
        }

        setEditorMode("cursor");
        setPendingEdits([]);
      }
    },
    [textEditActive, pendingEdits, setEditorMode]
  );

  // Copy edits to clipboard
  const copyEditsToClipboard = (edits: PendingEdit[]) => {
    const markdown = edits
      .map((edit) => {
        return `### ${edit.componentName}\n- **Original:** ${edit.originalText}\n- **New:** ${edit.newText}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(markdown).catch((err) => {
      console.error("[TextEditMode] Failed to copy to clipboard:", err);
    });
  };

  // Add pending edit
  const addPendingEdit = useCallback((edit: PendingEdit) => {
    setPendingEdits((prev) => [...prev, edit]);
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    if (!textEditActive) return;

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [textEditActive, handleKeyDown]);

  // Send text edit mode state to content script
  useEffect(() => {
    if (textEditActive) {
      sendToContent({
        type: "panel:text-edit",
        payload: { action: "activate" },
      });
    } else {
      sendToContent({
        type: "panel:text-edit",
        payload: { action: "deactivate" },
      });
    }
  }, [textEditActive]);

  // Show exit toast even after exiting mode
  if (!textEditActive) {
    if (showExitToast) {
      return (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-green-500/90 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-sm">
              {exitEditCount} text {exitEditCount === 1 ? "change" : "changes"} copied to clipboard!
            </div>
            <div className="text-white/80 text-xs mt-1">Paste into your editor or LLM prompt</div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <DogfoodBoundary name="TextEditMode" file="TextEditMode.tsx" category="mode">
      <>
        {/* Mode Indicator */}
        <div data-radflow-panel className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <div className="bg-amber-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
            Text Edit Mode
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-200 border border-neutral-600 shadow-lg flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Clipboard
          </div>
        </div>

        {/* Pending Edits Counter */}
        {pendingEdits.length > 0 && (
          <div
            data-radflow-panel
            className="fixed top-4 right-4 z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg px-3 py-2"
          >
            <div className="text-xs text-neutral-400">Pending Edits</div>
            <div className="text-lg font-semibold text-neutral-200">{pendingEdits.length}</div>
          </div>
        )}

        {/* Instructions */}
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              Click text to edit |{" "}
              <kbd className="bg-neutral-700 px-1 rounded">Esc</kbd> to exit mode
            </span>
          </div>
        </div>

        {/* Exit Toast */}
        {showExitToast && (
          <div
            data-radflow-panel
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-green-500/90 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="font-semibold text-sm">
                {exitEditCount} text {exitEditCount === 1 ? "change" : "changes"} copied to clipboard!
              </div>
              <div className="text-white/80 text-xs mt-1">Paste into your editor or LLM prompt</div>
            </div>
          </div>
        )}
      </>
    </DogfoodBoundary>
  );
}
