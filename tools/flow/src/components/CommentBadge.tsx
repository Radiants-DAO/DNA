import { useState } from "react";
import type { Feedback } from "../stores/types";
import { useAppStore } from "../stores/appStore";

interface CommentBadgeProps {
  index: number;
  comment: Feedback;
  onEdit?: (comment: Feedback) => void;
}

/**
 * CommentBadge - Numbered badge shown at the position where a comment was added.
 *
 * Features:
 * - Shows comment number
 * - Hover to show comment preview tooltip
 * - Click to highlight the associated element
 */
export function CommentBadge({ index, comment, onEdit }: CommentBadgeProps) {
  const [showPreview, setShowPreview] = useState(false);
  const removeComment = useAppStore((s) => s.removeComment);

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(comment);
    }
  };

  // Use exact click coordinates - badge appears where user clicked
  const position = comment.coordinates;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeComment(comment.id);
  };

  return (
    <div
      data-comment-overlay="true"
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      {/* Badge */}
      <div
        onClick={handleBadgeClick}
        className={`w-6 h-6 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
          comment.type === "question"
            ? "bg-purple-500 hover:bg-purple-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        title="Click to edit"
      >
        {comment.type === "question" ? "?" : index}
      </div>

      {/* Preview tooltip */}
      {showPreview && (
        <div className="absolute left-8 top-0 w-64 bg-surface border border-border rounded-lg shadow-xl overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface">
            <span className="text-xs font-medium text-text truncate">
              #{index} {comment.componentName}
            </span>
            <button
              onClick={handleRemove}
              className="p-0.5 text-text-muted hover:text-red-400 rounded hover:bg-white/5"
              title="Remove comment"
            >
              <TrashIcon />
            </button>
          </div>

          {/* Content */}
          <div className="px-3 py-2">
            <p className="text-sm text-text">{comment.content}</p>
            {comment.source && (
              <p className="text-xs text-text-muted mt-2 font-mono truncate">
                {comment.source.relativePath}:{comment.source.line}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default CommentBadge;
