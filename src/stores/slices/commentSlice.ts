import type { StateCreator } from "zustand";
import type { AppState, CommentSlice, Feedback, FeedbackType } from "../types";

/**
 * Feedback Slice (Comments + Questions)
 *
 * Manages visual feedback on UI elements:
 * - Comments: Implementation feedback for changes
 * - Questions: Questions to ask Claude about elements
 *
 * State model:
 * - editorMode === "comment" is the single source of truth for comment UI visibility
 * - activeFeedbackType tracks which type of feedback is being added
 *
 * Session-only (no persistence), auto-clears when files change.
 */
export const createCommentSlice: StateCreator<
  AppState,
  [],
  [],
  CommentSlice
> = (set, get) => ({
  comments: [],
  activeFeedbackType: null,
  hoveredCommentElement: null,
  selectedCommentElements: [], // Multi-select support

  setActiveFeedbackType: (type) => {
    set({ activeFeedbackType: type });

    if (type !== null) {
      // Enter comment mode
      set({
        editorMode: "comment",
        componentIdMode: false,
        textEditMode: false,
        previewMode: false,
      });
    } else {
      // Exiting - clear selection state
      set({
        hoveredCommentElement: null,
        selectedCommentElements: [],
      });
    }
  },

  addComment: (feedback) => {
    const newFeedback: Feedback = {
      ...feedback,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      comments: [...state.comments, newFeedback],
      selectedCommentElements: [],
    }));
  },

  updateComment: (id, content) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id ? { ...c, content } : c
      ),
    }));
  },

  removeComment: (id) => {
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
    }));
  },

  clearComments: () => {
    set({ comments: [], selectedCommentElements: [], hoveredCommentElement: null });
  },

  clearCommentsForFile: (filePath) => {
    set((state) => ({
      comments: state.comments.filter(
        (c) => !c.source || !c.source.filePath.includes(filePath)
      ),
    }));
  },

  setHoveredCommentElement: (selector) => {
    set({ hoveredCommentElement: selector });
  },

  // Single select - clears others and sets one element
  setSelectedCommentElement: (selector) => {
    set({ selectedCommentElements: selector ? [selector] : [] });
  },

  // Shift+click toggle - adds/removes from multi-selection
  toggleSelectedCommentElement: (selector) => {
    set((state) => {
      const current = state.selectedCommentElements;
      const index = current.indexOf(selector);
      if (index >= 0) {
        // Remove from selection
        return { selectedCommentElements: current.filter((s) => s !== selector) };
      } else {
        // Add to selection
        return { selectedCommentElements: [...current, selector] };
      }
    });
  },

  clearSelectedCommentElements: () => {
    set({ selectedCommentElements: [] });
  },

  compileToMarkdown: (type = "all") => {
    const { comments } = get();
    const filtered = type === "all"
      ? comments
      : comments.filter((c) => c.type === type);

    if (filtered.length === 0) {
      return type === "all"
        ? "No feedback to compile."
        : `No ${type}s to compile.`;
    }

    const feedbackComments = filtered.filter((c) => c.type === "comment");
    const feedbackQuestions = filtered.filter((c) => c.type === "question");

    const lines: string[] = [];

    // Helper to group feedback by file and format
    const formatFeedbackByFile = (
      items: typeof feedbackComments,
      prefix: string // "-" for comments, "?" for questions
    ) => {
      // Group by file path (or "No Source" for items without source)
      const byFile = new Map<string, typeof items>();

      for (const item of items) {
        const fileKey = item.source?.relativePath ?? "[No Source]";
        if (!byFile.has(fileKey)) {
          byFile.set(fileKey, []);
        }
        byFile.get(fileKey)!.push(item);
      }

      // Sort files alphabetically
      const sortedFiles = Array.from(byFile.keys()).sort();

      for (const filePath of sortedFiles) {
        const fileItems = byFile.get(filePath)!;

        // Sort by line number within file
        fileItems.sort((a, b) => {
          const lineA = a.source?.line ?? 0;
          const lineB = b.source?.line ?? 0;
          return lineA - lineB;
        });

        lines.push(`## ${filePath}`);
        lines.push("");

        for (const item of fileItems) {
          if (item.source) {
            lines.push(`### Line ${item.source.line}`);
            lines.push(`${prefix} ${item.content}`);
            if (item.componentName && item.componentName !== filePath) {
              lines.push(`  *(${item.componentName})*`);
            }
          } else if (item.devflowId) {
            // RadFlow UI element (devflow-id)
            lines.push(`### ${item.devflowId}`);
            lines.push(`${prefix} ${item.content}`);
          } else {
            // No source - use component name and selector info
            lines.push(`### ${item.componentName}`);
            lines.push(`${prefix} ${item.content}`);
            lines.push(`  *Selector: \`${item.elementSelector}\`*`);
          }
          lines.push("");
        }
      }
    };

    // Comments section
    if (feedbackComments.length > 0 && (type === "all" || type === "comment")) {
      lines.push("# Component Changes");
      lines.push("");

      formatFeedbackByFile(feedbackComments, "-");
    }

    // Questions section
    if (feedbackQuestions.length > 0 && (type === "all" || type === "question")) {
      if (lines.length > 0) {
        lines.push("---");
        lines.push("");
      }
      lines.push("# Questions");
      lines.push("");

      formatFeedbackByFile(feedbackQuestions, "?");
    }

    return lines.join("\n");
  },

  copyCommentsToClipboard: async (type = "all") => {
    const markdown = get().compileToMarkdown(type);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (err) {
      console.error("Failed to copy feedback to clipboard:", err);
    }
  },
});
