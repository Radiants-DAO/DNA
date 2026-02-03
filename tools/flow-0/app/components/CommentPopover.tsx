import { useState, useRef, useEffect } from "react";
import type { FeedbackType } from "../stores/types";
import { X, MessageCircle, HelpCircle } from "./ui/icons";

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
  const headerIcon = isQuestion ? <HelpCircle className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;

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
      className="fixed z-50 bg-surface border border-border rounded-lg shadow-xl w-80"
      style={{
        left: popoverPosition.left,
        top: popoverPosition.top,
      }}
    >
      {/* Header */}
      {/* Radiants colors: sky-blue for comments, sunset-fuzz for questions */}
      <div className={`px-3 py-2 border-b border-border flex items-center justify-between ${
        isQuestion ? "bg-[#FCC383]/10" : "bg-[#95BAD2]/10"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={isQuestion ? "text-[#FCC383]" : "text-[#95BAD2]"}>
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
          <X className="w-4 h-4" />
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
            isQuestion ? "focus:border-[#FCC383]" : "focus:border-[#95BAD2]"
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
              className={`px-3 py-1.5 text-xs text-content-inverted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isQuestion
                  ? "bg-[#FCC383] hover:bg-[#FCC383]/80"
                  : "bg-[#95BAD2] hover:bg-[#95BAD2]/80"
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

export default CommentPopover;
