import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { sendToContent } from "../api/contentBridge";
import { useInspection } from "../../entrypoints/panel/Panel";
import type { FeedbackType, Feedback } from "../stores/types";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * CommentMode - Add feedback comments to inspected page elements.
 *
 * In the Chrome extension, CommentMode does NOT directly access the inspected
 * page DOM (that would query the DevTools panel document instead). Instead it:
 * 1. Listens for element selections via the InspectionContext (Alt+click in content script)
 * 2. Shows a comment popover in the panel when an element is selected
 * 3. Sends comments to the content script via contentBridge
 */
export function CommentMode() {
  const editorMode = useAppStore((s) => s.editorMode);
  const inCommentMode = editorMode === "comment";

  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const comments = useAppStore((s) => s.comments);
  const addComment = useAppStore((s) => s.addComment);
  const clearSelectedCommentElements = useAppStore((s) => s.clearSelectedCommentElements);

  const { selectedElement } = useInspection();

  // Track whether we've shown the popover for the current selection
  const [showPopover, setShowPopover] = useState(false);
  const lastSelectorRef = useRef<string | null>(null);

  // When a new element is selected while in comment mode, show the popover
  useEffect(() => {
    if (!inCommentMode || !selectedElement) return;

    // Only show popover for new selections
    if (selectedElement.selector !== lastSelectorRef.current) {
      lastSelectorRef.current = selectedElement.selector;
      setShowPopover(true);
    }
  }, [inCommentMode, selectedElement]);

  // Reset when leaving comment mode
  useEffect(() => {
    if (!inCommentMode) {
      setShowPopover(false);
      lastSelectorRef.current = null;
    }
  }, [inCommentMode]);

  // Tell content script to highlight hovered elements in comment mode
  useEffect(() => {
    if (inCommentMode) {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "comment", action: "activate" },
      });
    } else {
      sendToContent({
        type: "panel:feature",
        payload: { featureId: "comment", action: "deactivate" },
      });
    }
  }, [inCommentMode]);

  // Handle comment submission
  const handleAddComment = useCallback(
    (content: string) => {
      if (!selectedElement || !activeFeedbackType) return;

      const componentName =
        selectedElement.id
          ? `#${selectedElement.id}`
          : selectedElement.tagName;

      addComment({
        type: activeFeedbackType,
        elementSelector: selectedElement.selector,
        componentName,
        devflowId: null,
        source: null,
        content,
        coordinates: {
          x: selectedElement.rect.left + selectedElement.rect.width / 2,
          y: selectedElement.rect.top,
        },
      });

      sendToContent({
        type: "panel:comment",
        payload: {
          id: `comment-${Date.now()}`,
          type: activeFeedbackType,
          selector: selectedElement.selector,
          componentName,
          content,
        },
      });

      setShowPopover(false);
      clearSelectedCommentElements();
    },
    [selectedElement, activeFeedbackType, addComment, clearSelectedCommentElements]
  );

  const handleCancel = useCallback(() => {
    setShowPopover(false);
    clearSelectedCommentElements();
  }, [clearSelectedCommentElements]);

  // Handle escape key
  useEffect(() => {
    if (!inCommentMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showPopover) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [inCommentMode, showPopover, handleCancel]);

  if (!inCommentMode) return null;

  return (
    <DogfoodBoundary name="CommentMode" file="CommentMode.tsx" category="mode">
      <>
        {/* Mode indicator */}
        <div
          data-radflow-panel
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-yellow-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <span>{activeFeedbackType === "question" ? "Question" : "Comment"} Mode</span>
            <span className="text-white/60">Alt+Click an element on the page</span>
          </div>
        </div>

        {/* Comment popover — shown when an element is selected */}
        {showPopover && selectedElement && activeFeedbackType && (
          <CommentPopover
            componentName={
              selectedElement.id
                ? `#${selectedElement.id}`
                : `${selectedElement.tagName}${selectedElement.classList.length > 0 ? `.${selectedElement.classList[0]}` : ""}`
            }
            feedbackType={activeFeedbackType}
            onSubmit={handleAddComment}
            onCancel={handleCancel}
          />
        )}

        {/* Comment count badge */}
        {comments.length > 0 && (
          <div
            data-radflow-panel
            className="fixed top-4 right-4 z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg px-3 py-2"
          >
            <div className="text-xs text-neutral-400">Comments</div>
            <div className="text-lg font-semibold text-neutral-200">{comments.length}</div>
          </div>
        )}
      </>
    </DogfoodBoundary>
  );
}

/**
 * CommentPopover - Input for adding comment content.
 * Positioned in the panel (not over the inspected page).
 */
function CommentPopover({
  componentName,
  feedbackType,
  onSubmit,
  onCancel,
}: {
  componentName: string;
  feedbackType: FeedbackType;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      data-radflow-panel
      className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-3 w-80">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${feedbackType === "question" ? "text-blue-400" : "text-yellow-400"}`}>
            {feedbackType === "question" ? "Question" : "Comment"}
          </span>
          <span className="text-xs text-neutral-400 truncate">{componentName}</span>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={feedbackType === "question" ? "Ask a question..." : "Add a comment..."}
          className="w-full h-20 bg-neutral-700 border border-neutral-600 rounded px-2 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 resize-none focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-neutral-500">Cmd+Enter to submit</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
