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
 * - Edits accumulate in pendingEdits store
 * - Esc exits mode and copies all edits to clipboard
 * - Toast shows change count on exit
 *
 * Note: Direct file write mode removed per fn-9 (context engineering pivot)
 */
export function TextEditMode() {
  // Derive textEditMode from editorMode (no longer a separate boolean)
  const textEditMode = useAppStore((s) => s.editorMode === "text-edit");
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const addPendingEdit = useAppStore((s) => s.addPendingEdit);
  const pendingEdits = useAppStore((s) => s.pendingEdits);
  const copyEditsToClipboard = useAppStore((s) => s.copyEditsToClipboard);
  const components = useAppStore((s) => s.components);
  // Dogfood mode allows editing RadFlow's own UI text
  const dogfoodMode = useAppStore((s) => s.dogfoodMode);

  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [showExitToast, setShowExitToast] = useState(false);
  const [exitEditCount, setExitEditCount] = useState(0);
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
    // Skip RadFlow panel elements UNLESS dogfood mode is enabled
    if (!dogfoodMode && element.closest("[data-radflow-panel]")) {
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
  }, [dogfoodMode]);

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

      element.style.outline = "2px solid var(--color-action-primary, #FCE184)";
      element.style.outlineOffset = "2px";
      element.style.borderRadius = "2px";
    },
    [activeEditor, findComponentForElement]
  );

  // Finish editing and track changes
  const finishEditing = useCallback(
    (editor: ActiveEditor) => {
      const { element, componentInfo, originalText } = editor;
      const newText = element.textContent || "";

      element.contentEditable = "false";
      element.style.outline = "";
      element.style.outlineOffset = "";

      if (newText !== originalText) {
        editedElementsRef.current.add(element);

        // Accumulate edit for clipboard
        addPendingEdit({
          componentName: componentInfo?.name || "Unknown",
          file: componentInfo?.file || "unknown",
          line: componentInfo?.line || 0,
          originalText,
          newText,
        });
      }
    },
    [addPendingEdit]
  );

  // Handle click to start editing
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Skip RadFlow panel elements UNLESS dogfood mode is enabled
      if (!dogfoodMode && target.closest("[data-radflow-panel]")) return;

      if (isEditableText(target)) {
        e.preventDefault();
        e.stopPropagation();
        startEditing(target);
      }
    },
    [isEditableText, startEditing, dogfoodMode]
  );

  // Handle mouse move for hover highlighting
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (activeEditor?.element === target) return;

      // Skip RadFlow panel elements UNLESS dogfood mode is enabled
      if (!dogfoodMode && target.closest("[data-radflow-panel]")) {
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
        target.style.backgroundColor = "rgba(149, 186, 210, 0.1)";
        setHoveredElement(target);
      } else {
        setHoveredElement(null);
      }
    },
    [isEditableText, hoveredElement, activeEditor, dogfoodMode]
  );

  // Handle keyboard events in editor
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
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
          finishEditing(activeEditor);
          setActiveEditor(null);
        }

        // Copy all changes to clipboard and exit mode
        const editCount = pendingEdits.length;
        if (editCount > 0) {
          copyEditsToClipboard();
          setExitEditCount(editCount);
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 3000);
        }

        setEditorMode("cursor");
      }

      // Handle Enter to finish current edit (but stay in mode)
      if (e.key === "Enter" && !e.shiftKey && activeEditor) {
        e.preventDefault();
        finishEditing(activeEditor);
        setActiveEditor(null);
      }
    },
    [activeEditor, finishEditing, pendingEdits, copyEditsToClipboard, setEditorMode]
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
          <div className="bg-[#CEF5CA] text-content-inverted px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
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
      {/* Mode Indicator - Radiants sunset-fuzz */}
      <div data-radflow-panel className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="bg-[#FCC383]/90 text-content-inverted px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Text Edit Mode
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface text-text border border-edge shadow-lg flex items-center gap-1.5">
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
          <div className="bg-[#FCC383] text-content-inverted px-2 py-1 rounded text-xs shadow-lg">
            Click to edit
          </div>
        </div>
      )}

      {/* Exit Toast */}
      {showExitToast && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-[#CEF5CA] text-content-inverted px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
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
