import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import type { ComponentInfo } from "../bindings";

interface ActiveEditor {
  element: HTMLElement;
  componentInfo: ComponentInfo | null;
  originalText: string;
}

/**
 * Text Edit Mode overlay.
 *
 * Features:
 * - T key toggles Text Edit mode
 * - Text elements become contentEditable on click
 * - Rich text support: bold (Cmd+B), italic (Cmd+I)
 * - Toggle between clipboard mode and direct file write
 * - Cmd+Z undo / Cmd+Shift+Z redo for direct writes
 * - External file change detection with conflict dialog
 * - Toast shows change count on exit
 */
export function TextEditMode() {
  const textEditMode = useAppStore((s) => s.textEditMode);
  const setTextEditMode = useAppStore((s) => s.setTextEditMode);
  const addPendingEdit = useAppStore((s) => s.addPendingEdit);
  const pendingEdits = useAppStore((s) => s.pendingEdits);
  const copyEditsToClipboard = useAppStore((s) => s.copyEditsToClipboard);
  const components = useAppStore((s) => s.components);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const setDirectWriteMode = useAppStore((s) => s.setDirectWriteMode);
  const writeTextChange = useAppStore((s) => s.writeTextChange);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const undoStack = useAppStore((s) => s.undoStack);
  const redoStack = useAppStore((s) => s.redoStack);
  const conflictFile = useAppStore((s) => s.conflictFile);
  const setConflictChoice = useAppStore((s) => s.setConflictChoice);
  const resolveConflict = useAppStore((s) => s.resolveConflict);

  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [showExitToast, setShowExitToast] = useState(false);
  const [exitEditCount, setExitEditCount] = useState(0);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoToastMessage, setUndoToastMessage] = useState("");
  const [writeError, setWriteError] = useState<string | null>(null);
  const editedElementsRef = useRef<Set<HTMLElement>>(new Set());

  // Find component info for an element based on position
  const findComponentForElement = useCallback(
    (element: HTMLElement): ComponentInfo | null => {
      if (components.length > 0) {
        return components[0];
      }
      return null;
    },
    [components]
  );

  // Check if element is editable text
  const isEditableText = useCallback((element: HTMLElement): boolean => {
    if (element.closest("[data-radflow-panel]")) {
      return false;
    }

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const textTags = [
      "p", "span", "h1", "h2", "h3", "h4", "h5", "h6",
      "a", "li", "td", "th", "label", "button", "div",
    ];

    if (textTags.includes(tagName)) {
      const hasTextContent = Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );
      return hasTextContent || element.textContent?.trim().length! > 0;
    }

    return false;
  }, []);

  // Start editing an element
  const startEditing = useCallback(
    (element: HTMLElement) => {
      if (activeEditor?.element === element) return;

      if (activeEditor) {
        finishEditing(activeEditor);
      }

      const componentInfo = findComponentForElement(element);
      const originalText = element.textContent || "";

      element.contentEditable = "true";
      element.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);

      setActiveEditor({
        element,
        componentInfo,
        originalText,
      });

      element.style.outline = "2px solid var(--color-accent, #3b82f6)";
      element.style.outlineOffset = "2px";
      element.style.borderRadius = "2px";
    },
    [activeEditor, findComponentForElement]
  );

  // Finish editing and track changes
  const finishEditing = useCallback(
    async (editor: ActiveEditor) => {
      const { element, componentInfo, originalText } = editor;
      const newText = element.textContent || "";

      element.contentEditable = "false";
      element.style.outline = "";
      element.style.outlineOffset = "";

      if (newText !== originalText) {
        editedElementsRef.current.add(element);

        if (directWriteMode && componentInfo) {
          // Direct write mode - write to file
          const result = await writeTextChange(
            componentInfo.file,
            componentInfo.line,
            originalText,
            newText
          );

          if (!result.success) {
            setWriteError(result.error || "Failed to write change");
            // Revert the DOM change
            element.textContent = originalText;
            setTimeout(() => setWriteError(null), 3000);
          }
        } else {
          // Clipboard mode - accumulate edit
          addPendingEdit({
            componentName: componentInfo?.name || "Unknown",
            file: componentInfo?.file || "unknown",
            line: componentInfo?.line || 0,
            originalText,
            newText,
          });
        }
      }
    },
    [addPendingEdit, directWriteMode, writeTextChange]
  );

  // Handle click to start editing
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.closest("[data-radflow-panel]")) return;

      if (isEditableText(target)) {
        e.preventDefault();
        e.stopPropagation();
        startEditing(target);
      }
    },
    [isEditableText, startEditing]
  );

  // Handle mouse move for hover highlighting
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (activeEditor?.element === target) return;

      if (target.closest("[data-radflow-panel]")) {
        if (hoveredElement) {
          hoveredElement.style.backgroundColor = "";
          setHoveredElement(null);
        }
        return;
      }

      if (hoveredElement && hoveredElement !== target) {
        hoveredElement.style.backgroundColor = "";
      }

      if (isEditableText(target)) {
        target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        setHoveredElement(target);
      } else {
        setHoveredElement(null);
      }
    },
    [isEditableText, hoveredElement, activeEditor]
  );

  // Handle keyboard events in editor
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      // Handle undo/redo in direct write mode
      if (directWriteMode && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.stopPropagation();

        if (e.shiftKey) {
          // Redo
          const result = await redo();
          if (result.success) {
            setUndoToastMessage("Redo successful");
            setShowUndoToast(true);
            setTimeout(() => setShowUndoToast(false), 1500);
          }
        } else {
          // Undo
          const result = await undo();
          if (result.success) {
            setUndoToastMessage("Undo successful");
            setShowUndoToast(true);
            setTimeout(() => setShowUndoToast(false), 1500);
          }
        }
        return;
      }

      // Handle rich text formatting in active editor
      if (activeEditor && (e.metaKey || e.ctrlKey)) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            document.execCommand("bold");
            return;
          case "i":
            e.preventDefault();
            document.execCommand("italic");
            return;
          case "u":
            e.preventDefault();
            document.execCommand("underline");
            return;
        }
      }

      // Handle Escape to exit edit mode
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();

        if (activeEditor) {
          await finishEditing(activeEditor);
          setActiveEditor(null);
        }

        // Copy all changes to clipboard and exit mode (clipboard mode only)
        if (!directWriteMode) {
          const editCount = pendingEdits.length;
          if (editCount > 0) {
            copyEditsToClipboard();
            setExitEditCount(editCount);
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 3000);
          }
        }

        setTextEditMode(false);
      }

      // Handle Enter to finish current edit (but stay in mode)
      if (e.key === "Enter" && !e.shiftKey && activeEditor) {
        e.preventDefault();
        await finishEditing(activeEditor);
        setActiveEditor(null);
      }
    },
    [activeEditor, finishEditing, pendingEdits, copyEditsToClipboard, setTextEditMode, directWriteMode, undo, redo]
  );

  // Clean up hover state on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoveredElement) {
      hoveredElement.style.backgroundColor = "";
      setHoveredElement(null);
    }
  }, [hoveredElement]);

  // Set up event listeners when mode is active
  useEffect(() => {
    if (!textEditMode) {
      if (activeEditor) {
        finishEditing(activeEditor);
        setActiveEditor(null);
      }

      if (hoveredElement) {
        hoveredElement.style.backgroundColor = "";
        setHoveredElement(null);
      }

      document.body.style.cursor = "";
      return;
    }

    document.body.style.cursor = "text";

    document.addEventListener("click", handleClick, true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.cursor = "";
    };
  }, [
    textEditMode,
    handleClick,
    handleMouseMove,
    handleMouseLeave,
    handleKeyDown,
    activeEditor,
    finishEditing,
    hoveredElement,
  ]);

  if (!textEditMode) {
    if (showExitToast) {
      return (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
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
    <>
      {/* Mode Indicator with Toggle */}
      <div data-radflow-panel className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="bg-purple-600/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Text Edit Mode
        </div>
        <button
          onClick={() => setDirectWriteMode(!directWriteMode)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-colors flex items-center gap-1.5
            ${directWriteMode ? "bg-orange-500 text-white" : "bg-surface text-text border border-edge"}
          `}
        >
          {directWriteMode ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Direct Write
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Clipboard
            </>
          )}
        </button>
      </div>

      {/* Undo/Redo Status (direct write mode) */}
      {directWriteMode && (
        <div
          data-radflow-panel
          className="fixed top-4 right-4 z-50 bg-surface border border-edge rounded-lg shadow-lg px-3 py-2"
        >
          <div className="text-xs text-text-muted mb-1">Undo History</div>
          <div className="flex items-center gap-2 text-xs">
            <span className={undoStack.length > 0 ? "text-text" : "text-text-muted"}>
              {undoStack.length} undos
            </span>
            <span className="text-text-muted">|</span>
            <span className={redoStack.length > 0 ? "text-text" : "text-text-muted"}>
              {redoStack.length} redos
            </span>
          </div>
          <div className="text-[10px] text-text-muted mt-1">
            <kbd className="bg-background px-1 rounded">⌘Z</kbd> undo /{" "}
            <kbd className="bg-background px-1 rounded">⌘⇧Z</kbd> redo
          </div>
        </div>
      )}

      {/* Pending Edits Counter (clipboard mode) */}
      {!directWriteMode && pendingEdits.length > 0 && (
        <div
          data-radflow-panel
          className="fixed top-4 right-4 z-50 bg-surface border border-edge rounded-lg shadow-lg px-3 py-2"
        >
          <div className="text-xs text-text-muted">Pending Edits</div>
          <div className="text-lg font-semibold text-text">{pendingEdits.length}</div>
        </div>
      )}

      {/* Active Editor Toolbar */}
      {activeEditor && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-surface border border-edge rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-text-muted">Formatting:</span>
            <button
              onClick={() => document.execCommand("bold")}
              className="px-2 py-1 text-sm font-bold hover:bg-background rounded"
              title="Bold (Cmd+B)"
            >
              B
            </button>
            <button
              onClick={() => document.execCommand("italic")}
              className="px-2 py-1 text-sm italic hover:bg-background rounded"
              title="Italic (Cmd+I)"
            >
              I
            </button>
            <button
              onClick={() => document.execCommand("underline")}
              className="px-2 py-1 text-sm underline hover:bg-background rounded"
              title="Underline (Cmd+U)"
            >
              U
            </button>
            <div className="h-4 w-px bg-edge mx-2" />
            <span className="text-xs text-text-muted">
              <kbd className="bg-background px-1 rounded">Enter</kbd> to finish,{" "}
              <kbd className="bg-background px-1 rounded">Esc</kbd> to exit mode
            </span>
          </div>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredElement && !activeEditor && (
        <div
          data-radflow-panel
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${hoveredElement.getBoundingClientRect().left}px`,
            top: `${hoveredElement.getBoundingClientRect().top - 28}px`,
          }}
        >
          <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs shadow-lg">
            Click to edit
          </div>
        </div>
      )}

      {/* Undo/Redo Toast */}
      {showUndoToast && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-medium">{undoToastMessage}</div>
          </div>
        </div>
      )}

      {/* Write Error Toast */}
      {writeError && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm font-medium">{writeError}</div>
          </div>
        </div>
      )}

      {/* Conflict Dialog */}
      {conflictFile && (
        <div
          data-radflow-panel
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-surface border border-edge rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">File Modified Externally</h3>
                <p className="text-sm text-text-muted">The file has been changed outside RadFlow</p>
              </div>
            </div>
            <p className="text-sm text-text mb-1">File:</p>
            <p className="text-xs text-text-muted mb-4 font-mono bg-background px-2 py-1 rounded truncate">
              {conflictFile}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConflictChoice("overwrite");
                  resolveConflict();
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Overwrite
              </button>
              <button
                onClick={() => {
                  setConflictChoice("reload");
                  resolveConflict();
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Reload
              </button>
              <button
                onClick={() => {
                  setConflictChoice("cancel");
                  resolveConflict();
                }}
                className="flex-1 px-4 py-2 bg-surface border border-edge text-text rounded-lg text-sm font-medium hover:bg-background transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Toast */}
      {showExitToast && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-sm">
              {exitEditCount} text {exitEditCount === 1 ? "change" : "changes"} copied to clipboard!
            </div>
            <div className="text-white/80 text-xs mt-1">Paste into your editor or LLM prompt</div>
          </div>
        </div>
      )}
    </>
  );
}
