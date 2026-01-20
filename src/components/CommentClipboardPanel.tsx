import { useMemo, useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import type { Feedback, FeedbackType } from "../stores/types";

type FilterTab = "all" | FeedbackType;

/**
 * CommentClipboardPanel - Panel showing comment list and markdown preview.
 *
 * Features:
 * - List of all comments with source info
 * - Live markdown preview
 * - Copy to clipboard button
 * - Clear all button
 */
export function CommentClipboardPanel() {
  const comments = useAppStore((s) => s.comments);
  const removeComment = useAppStore((s) => s.removeComment);
  const clearComments = useAppStore((s) => s.clearComments);
  const compileToMarkdown = useAppStore((s) => s.compileToMarkdown);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);

  const [copied, setCopied] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Filter comments based on active tab
  const filteredComments = useMemo(() => {
    if (activeTab === "all") return comments;
    return comments.filter((c) => c.type === activeTab);
  }, [comments, activeTab]);

  // Counts for tabs
  const commentCount = comments.filter((c) => c.type === "comment").length;
  const questionCount = comments.filter((c) => c.type === "question").length;

  // Jump to and highlight an element
  const jumpToElement = useCallback((comment: Feedback) => {
    // Try to find element by selector
    let element: Element | null = document.querySelector(
      `[data-radflow-id="${comment.elementSelector}"]`
    );

    if (!element) {
      try {
        element = document.querySelector(comment.elementSelector);
      } catch {
        // Invalid selector
      }
    }

    if (element) {
      // Scroll into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Flash highlight in list
      setHighlightedId(comment.id);
      setTimeout(() => setHighlightedId(null), 2000);

      // Create a visual flash overlay on the element
      const rect = element.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(59, 130, 246, 0.3);
        border: 2px solid rgb(59, 130, 246);
        border-radius: 4px;
        pointer-events: none;
        z-index: 9999;
        animation: flash-fade 1.5s ease-out forwards;
      `;

      // Add animation styles if not already present
      if (!document.getElementById("comment-flash-styles")) {
        const style = document.createElement("style");
        style.id = "comment-flash-styles";
        style.textContent = `
          @keyframes flash-fade {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
            100% { opacity: 0; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 1500);
    }
  }, []);

  // Compile markdown preview based on active tab
  const markdownPreview = useMemo(() => {
    return compileToMarkdown(activeTab);
  }, [compileToMarkdown, activeTab, comments]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    await copyCommentsToClipboard(activeTab);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full" data-devflow-id="feedback-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10" data-devflow-id="feedback-panel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">Feedback</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {comments.length === 0
                ? "No feedback yet"
                : `${commentCount} comment${commentCount !== 1 ? "s" : ""}, ${questionCount} question${questionCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          {comments.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors"
                title="Copy to clipboard (Shift+Cmd+C)"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
              <button
                onClick={clearComments}
                className="p-1.5 text-text-muted hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                title="Clear all feedback"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        {comments.length > 0 && (
          <div className="flex gap-1 mt-3">
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label="All"
              count={comments.length}
            />
            <TabButton
              active={activeTab === "comment"}
              onClick={() => setActiveTab("comment")}
              label="Comments"
              count={commentCount}
              color="blue"
            />
            <TabButton
              active={activeTab === "question"}
              onClick={() => setActiveTab("question")}
              label="Questions"
              count={questionCount}
              color="purple"
            />
          </div>
        )}
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-auto" data-devflow-id="feedback-list">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <CommentIcon />
            </div>
            <p className="text-sm text-text-muted">
              {comments.length === 0
                ? "Click elements to add feedback"
                : `No ${activeTab === "comment" ? "comments" : "questions"} yet`}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">C</kbd> for comments,{" "}
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Q</kbd> for questions
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredComments.map((comment, index) => {
              const isQuestion = comment.type === "question";
              const badgeColor = isQuestion ? "bg-purple-500" : "bg-blue-500";
              const highlightColor = isQuestion ? "ring-purple-500 bg-purple-500/20" : "ring-blue-500 bg-blue-500/20";

              return (
                <div
                  key={comment.id}
                  onClick={() => jumpToElement(comment)}
                  className={`group rounded-lg p-3 cursor-pointer transition-all ${
                    highlightedId === comment.id
                      ? highlightColor
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 ${badgeColor} text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0`}>
                        {isQuestion ? "?" : index + 1}
                      </span>
                      <span className="text-sm font-medium text-text truncate">
                        {comment.devflowId ? `[DevFlow] ${comment.componentName}` : comment.componentName}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeComment(comment.id);
                      }}
                      className="p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Remove"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <p className="text-sm text-text mt-2 pl-7">
                    {isQuestion ? "Q: " : ""}{comment.content}
                  </p>

                  {comment.devflowId ? (
                    <p className="text-xs text-purple-400/70 mt-2 pl-7 font-mono truncate">
                      devflow:{comment.devflowId}
                    </p>
                  ) : comment.source ? (
                    <p className="text-xs text-text-muted mt-2 pl-7 font-mono truncate">
                      {comment.source.relativePath}:{comment.source.line}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted/50 mt-2 pl-7 italic">
                      Click to jump to element
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Markdown Preview */}
      {comments.length > 0 && (
        <div className="border-t border-white/10" data-devflow-id="feedback-preview">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">Markdown Preview</span>
          </div>
          <div className="px-4 pb-4">
            <pre className="text-xs text-text-muted font-mono bg-black/20 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
              {markdownPreview}
            </pre>
          </div>
        </div>
      )}

      {/* Footer with Copy Button */}
      {comments.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={handleCopy}
            className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon />
                Copy to Clipboard
              </>
            )}
          </button>
          <p className="text-xs text-text-muted text-center mt-2">
            Shift+Cmd+C
          </p>
        </div>
      )}
    </div>
  );
}

// Icons
function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: "blue" | "purple";
}

function TabButton({ active, onClick, label, count, color }: TabButtonProps) {
  const activeColors = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500",
  };

  const activeClass = color
    ? activeColors[color]
    : "bg-white/10 text-text border-white/20";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex items-center gap-1.5 ${
        active
          ? activeClass
          : "border-transparent text-text-muted hover:text-text hover:bg-white/5"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
          active ? "bg-white/20" : "bg-white/10"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default CommentClipboardPanel;
