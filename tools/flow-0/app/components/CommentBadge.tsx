import { useState } from "react";
import type { Feedback } from "../stores/types";
import { useAppStore } from "../stores/appStore";
import { Trash2 } from "./ui/icons";

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
      {/* Badge - Radiants colors: sky-blue for comments, sunset-fuzz for questions */}
      <div
        onClick={handleBadgeClick}
        className={`w-6 h-6 text-content-inverted text-xs font-bold rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
          comment.type === "question"
            ? "bg-[#FCC383] hover:bg-[#FCC383]/80"
            : "bg-[#95BAD2] hover:bg-[#95BAD2]/80"
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
              <Trash2 className="w-3.5 h-3.5" />
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

export default CommentBadge;
