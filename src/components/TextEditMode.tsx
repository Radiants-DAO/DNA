import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import type { ComponentInfo } from "../bindings";

interface EditableElement {
  element: HTMLElement;
  componentInfo: ComponentInfo | null;
  originalText: string;
}

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
 * - Changes tracked in store with original/new values
 * - Escape exits mode with changes preserved in clipboard
 * - Toast shows change count on exit
 */
export function TextEditMode() {
  const textEditMode = useAppStore((s) => s.textEditMode);
  const setTextEditMode = useAppStore((s) => s.setTextEditMode);
  const addPendingEdit = useAppStore((s) => s.addPendingEdit);
  const pendingEdits = useAppStore((s) => s.pendingEdits);
  const copyEditsToClipboard = useAppStore((s) => s.copyEditsToClipboard);
  const clearPendingEdits = useAppStore((s) => s.clearPendingEdits);
  const components = useAppStore((s) => s.components);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const setDirectWriteMode = useAppStore((s) => s.setDirectWriteMode);

  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [showExitToast, setShowExitToast] = useState(false);
  const [exitEditCount, setExitEditCount] = useState(0);
  const editedElementsRef = useRef<Set<HTMLElement>>(new Set());

  // Find component info for an element based on position
  // In production, this would use data attributes set during render
  const findComponentForElement = useCallback(
    (element: HTMLElement): ComponentInfo | null => {
      // For now, return first component if we have any
      // Real implementation would correlate DOM position to SWC data
      if (components.length > 0) {
        return components[0];
      }
      return null;
    },
    [components]
  );

  // Check if element is editable text
  const isEditableText = useCallback((element: HTMLElement): boolean => {
    // Skip our own UI elements
    if (element.closest("[data-radflow-panel]")) {
      return false;
    }

    // Skip inputs and textareas (they have their own editing)
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      return false;
    }

    // Check if element contains text content
    const tagName = element.tagName.toLowerCase();
    const textTags = [
      "p",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "li",
      "td",
      "th",
      "label",
      "button",
      "div",
    ];

    if (textTags.includes(tagName)) {
      // Check if has direct text content (not just child elements)
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

      // End previous editing if any
      if (activeEditor) {
        finishEditing(activeEditor);
      }

      const componentInfo = findComponentForElement(element);
      const originalText = element.textContent || "";

      // Make element editable
      element.contentEditable = "true";
      element.focus();

      // Select all text
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

      // Add visual indicator
      element.style.outline = "2px solid var(--color-accent, #3b82f6)";
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

      // Remove editable state
      element.contentEditable = "false";
      element.style.outline = "";
      element.style.outlineOffset = "";

      // Track change if text was modified
      if (newText !== originalText) {
        editedElementsRef.current.add(element);

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

      // Skip our own UI
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

      // Skip if we're actively editing
      if (activeEditor?.element === target) return;

      // Skip our own UI
      if (target.closest("[data-radflow-panel]")) {
        if (hoveredElement) {
          hoveredElement.style.backgroundColor = "";
          setHoveredElement(null);
        }
        return;
      }

      // Remove previous hover
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
    (e: KeyboardEvent) => {
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

        // Finish current editing
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

        setTextEditMode(false);
      }

      // Handle Enter to finish current edit (but stay in mode)
      if (e.key === "Enter" && !e.shiftKey && activeEditor) {
        e.preventDefault();
        finishEditing(activeEditor);
        setActiveEditor(null);
      }
    },
    [activeEditor, finishEditing, pendingEdits, copyEditsToClipboard, setTextEditMode]
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
      // Clean up any active editing
      if (activeEditor) {
        finishEditing(activeEditor);
        setActiveEditor(null);
      }

      // Clean up hover
      if (hoveredElement) {
        hoveredElement.style.backgroundColor = "";
        setHoveredElement(null);
      }

      // Reset cursor
      document.body.style.cursor = "";
      return;
    }

    // Change cursor to text
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
    // Show exit toast even when mode is off
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
      {/* Mode Indicator */}
      <div data-radflow-panel className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        <div className="bg-purple-600/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Text Edit Mode
        </div>
        <button
          onClick={() => setDirectWriteMode(!directWriteMode)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-colors
            ${directWriteMode ? "bg-orange-500 text-white" : "bg-surface text-text border border-edge"}
          `}
        >
          {directWriteMode ? "Direct Write ON" : "Clipboard Mode"}
        </button>
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
          <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs shadow-lg">
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
