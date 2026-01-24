import { useState, useRef, useEffect } from "react";
import type { FeedbackType } from "../stores/types";

interface CommentPopoverProps {
  position: { x: number; y: number };
  componentName: string;
  feedbackType: FeedbackType;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  /** For edit mode: initial content to populate */
  initialContent?: string;
  /** For edit mode: whether we're editing an existing comment */
  isEditing?: boolean;
}

/**
 * CommentPopover - Input popover for adding a comment at click position.
 *
 * Features:
 * - Positioned near click location (smart repositioning to stay in viewport)
 * - Shows component name
 * - Text input with Enter to confirm, Escape to cancel
 */
export function CommentPopover({
  position,
  componentName,
  feedbackType,
  onSubmit,
  onCancel,
  initialContent = "",
  isEditing = false,
}: CommentPopoverProps) {
  const [content, setContent] = useState(initialContent);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isQuestion = feedbackType === "question";
  const placeholder = isQuestion
    ? "Ask a question about this element..."
    : "Add your feedback...";
  const buttonLabel = isEditing
    ? "Save"
    : isQuestion
      ? "Add Question"
      : "Add Comment";
  const headerIcon = isQuestion ? <QuestionIcon /> : <CommentIcon />;

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        onSubmit(content.trim());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  // Handle submit button click
  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
    }
  };

  // Calculate position to keep popover in viewport
  const calculatePosition = () => {
    const padding = 16;
    const popoverWidth = 320;
    const popoverHeight = 180;

    let left = position.x + padding;
    let top = position.y + padding;

    // Adjust if going off right edge
    if (left + popoverWidth > window.innerWidth - padding) {
      left = position.x - popoverWidth - padding;
    }

    // Adjust if going off bottom edge
    if (top + popoverHeight > window.innerHeight - padding) {
      top = position.y - popoverHeight - padding;
    }

    // Ensure not going off left or top
    left = Math.max(padding, left);
    top = Math.max(padding, top);

    return { left, top };
  };

  const popoverPosition = calculatePosition();

  return (
    <div
      ref={popoverRef}
      data-comment-overlay="true"
      className="fixed z-[60] bg-surface border border-border rounded-lg shadow-xl w-80"
      style={{
        left: popoverPosition.left,
        top: popoverPosition.top,
      }}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b border-border flex items-center justify-between ${
        isQuestion ? "bg-purple-500/10" : "bg-blue-500/10"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={isQuestion ? "text-purple-400" : "text-blue-400"}>
            {headerIcon}
          </span>
          <span className="text-sm font-medium text-text truncate">
            {componentName}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-text-muted hover:text-text rounded hover:bg-white/5"
          title="Cancel (Esc)"
        >
          <XIcon />
        </button>
      </div>

      {/* Input area */}
      <div className="p-3">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-20 bg-background/50 border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none ${
            isQuestion ? "focus:border-purple-500" : "focus:border-blue-500"
          }`}
        />

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-muted">
            Enter to add, Shift+Enter for new line
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={`px-3 py-1.5 text-xs text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isQuestion
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default CommentPopover;
