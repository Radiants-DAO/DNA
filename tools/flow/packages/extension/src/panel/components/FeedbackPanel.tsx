/**
 * FeedbackPanel - Lists comments and questions from comment mode.
 *
 * Two view modes:
 * - Grouped (default): comments organized by element/component
 * - Timeline: flat chronological list
 *
 * Each comment shows: type badge, component name, content, timestamp.
 * Edit/delete per comment. "Copy feedback" copies compiled markdown.
 */

import { useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { sendToContent } from "../api/contentBridge";
import type { Feedback } from "../stores/types";
import { DogfoodBoundary } from "./ui/DogfoodBoundary";

type ViewMode = "grouped" | "timeline";

function groupByElement(comments: Feedback[]): Map<string, Feedback[]> {
  const grouped = new Map<string, Feedback[]>();
  for (const c of comments) {
    const key = c.componentName || c.elementSelector;
    const existing = grouped.get(key) ?? [];
    existing.push(c);
    grouped.set(key, [...existing]);
  }
  return grouped;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FeedbackPanel() {
  const comments = useAppStore((s) => s.comments);
  const removeComment = useAppStore((s) => s.removeComment);
  const updateComment = useAppStore((s) => s.updateComment);
  const clearComments = useAppStore((s) => s.clearComments);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const setActiveFeedbackType = useAppStore((s) => s.setActiveFeedbackType);

  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyCommentsToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [copyCommentsToClipboard]);

  const startEdit = (comment: Feedback) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const confirmEdit = () => {
    if (editingId && editContent.trim()) {
      updateComment(editingId, editContent.trim());
    }
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = (id: string) => {
    removeComment(id);
    sendToContent({ type: "panel:comment-remove", payload: { id } });
  };

  const handleClear = () => {
    clearComments();
    sendToContent({ type: "panel:comment-clear", payload: {} });
  };

  if (comments.length === 0) {
    return (
      <DogfoodBoundary name="FeedbackPanel" file="FeedbackPanel.tsx" category="panel">
        <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3 p-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm">No feedback yet</p>
          <p className="text-xs text-neutral-600">
            {activeFeedbackType
              ? "Alt+Click an element on the page to add feedback"
              : "Activate comment or question mode to start"}
          </p>
          {!activeFeedbackType && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setActiveFeedbackType("comment")}
                className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
              >
                Comment Mode
              </button>
              <button
                onClick={() => setActiveFeedbackType("question")}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Question Mode
              </button>
            </div>
          )}
        </div>
      </DogfoodBoundary>
    );
  }

  const grouped = groupByElement(comments);

  return (
    <DogfoodBoundary name="FeedbackPanel" file="FeedbackPanel.tsx" category="panel">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-200">
              Feedback
            </span>
            <span className="text-xs text-neutral-500">
              {comments.length} item{comments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === "grouped" ? "timeline" : "grouped")}
              className="px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
              title={viewMode === "grouped" ? "Switch to timeline" : "Switch to grouped"}
            >
              {viewMode === "grouped" ? "Timeline" : "Grouped"}
            </button>
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            {/* Clear */}
            <button
              onClick={handleClear}
              className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {viewMode === "grouped" ? (
            Array.from(grouped.entries()).map(([element, items]) => (
              <div key={element} className="mb-3">
                <div className="text-xs font-medium text-neutral-400 px-2 py-1 truncate">
                  {element}
                </div>
                {items.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    editing={editingId === comment.id}
                    editContent={editContent}
                    onEditContent={setEditContent}
                    onStartEdit={() => startEdit(comment)}
                    onConfirmEdit={confirmEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(comment.id)}
                  />
                ))}
              </div>
            ))
          ) : (
            [...comments]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  editing={editingId === comment.id}
                  editContent={editContent}
                  onEditContent={setEditContent}
                  onStartEdit={() => startEdit(comment)}
                  onConfirmEdit={confirmEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => handleDelete(comment.id)}
                />
              ))
          )}
        </div>
      </div>
    </DogfoodBoundary>
  );
}

function CommentCard({
  comment,
  editing,
  editContent,
  onEditContent,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: Feedback;
  editing: boolean;
  editContent: string;
  onEditContent: (v: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const isQuestion = comment.type === "question";

  return (
    <div className="group px-2 py-1.5 rounded hover:bg-neutral-800/50 transition-colors">
      <div className="flex items-start gap-2">
        {/* Type badge */}
        <span
          className={`mt-0.5 shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
            isQuestion
              ? "bg-blue-500/20 text-blue-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {isQuestion ? "Q" : "C"}
        </span>

        <div className="flex-1 min-w-0">
          {/* Component name + time */}
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
            <span className="truncate">{comment.componentName}</span>
            <span>{formatTime(comment.timestamp)}</span>
          </div>

          {/* Content */}
          {editing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => onEditContent(e.target.value)}
                className="w-full text-xs bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-neutral-200 resize-none focus:outline-none focus:border-blue-500"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onConfirmEdit();
                  }
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={onConfirmEdit}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-300 mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions (visible on hover) */}
        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 shrink-0 transition-opacity">
            <button
              onClick={onStartEdit}
              className="text-neutral-500 hover:text-neutral-300 p-0.5"
              title="Edit"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-neutral-500 hover:text-red-400 p-0.5"
              title="Delete"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
