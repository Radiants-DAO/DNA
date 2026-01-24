import type { StateCreator } from "zustand";
import type { AppState, CommentSlice, Feedback, FeedbackType, RichContext } from "../types";

// ============================================================================
// Helper Functions for Markdown Formatting
// ============================================================================

/**
 * Format props for markdown output.
 * Filters out undefined/null values, limits to 5 props, formats as inline code.
 */
function formatProps(props: Record<string, unknown>): string {
  const entries = Object.entries(props)
    .filter(([_, v]) => v !== undefined && v !== null && typeof v !== "function")
    .slice(0, 5);

  if (entries.length === 0) return "";

  return entries
    .map(([k, v]) => {
      const value = typeof v === "string" ? `"${v}"` : JSON.stringify(v);
      return `\`${k}=${value}\``;
    })
    .join(", ");
}

/**
 * Format parent chain for markdown output.
 * Limits to 4 parents, joins with arrow.
 */
function formatParentChain(chain: string[]): string {
  return chain.slice(0, 4).join(" → ");
}

/**
 * Format rich context as markdown block.
 */
function formatRichContext(ctx: RichContext, selector: string): string[] {
  const lines: string[] = [];

  // Build header with provenance detail if available
  const provenanceLabel = ctx.provenanceDetail
    ? `${ctx.provenance} - ${ctx.provenanceDetail}`
    : ctx.provenance;
  lines.push(`  **Context** (${provenanceLabel}):`);

  // Fiber type
  if (ctx.fiberType) {
    const typeLabel = ctx.fiberType === "forward_ref" ? "forwardRef" : ctx.fiberType;
    lines.push(`  - Type: ${typeLabel} component`);
  }

  // Props
  if (ctx.props && Object.keys(ctx.props).length > 0) {
    const propsStr = formatProps(ctx.props);
    if (propsStr) {
      lines.push(`  - Props: ${propsStr}`);
    }
  }

  // Parent chain
  if (ctx.parentChain && ctx.parentChain.length > 0) {
    lines.push(`  - Parents: ${formatParentChain(ctx.parentChain)}`);
  }

  // Fallback selectors (only if provenance is bridge)
  if (ctx.provenance === "bridge" && ctx.fallbackSelectors && ctx.fallbackSelectors.length > 0) {
    const selectors = ctx.fallbackSelectors.slice(0, 3).map(s => `\`${s}\``).join(", ");
    lines.push(`  - Fallback selectors: ${selectors}`);
  }

  // For DOM-only items, include the selector
  if (ctx.provenance === "dom") {
    lines.push(`  - Selector: \`${selector}\``);
    if (ctx.provenanceDetail === "DOM inspection fallback") {
      lines.push(`  - *No component source - element identified by DOM inspection only*`);
    }
  }

  // For fiber provenance, always include selector for reference
  if (ctx.provenance === "fiber") {
    lines.push(`  - Selector: \`${selector}\``);
  }

  return lines;
}

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
      // Group by file path (or "No React Source" for items without source)
      const byFile = new Map<string, typeof items>();

      for (const item of items) {
        const fileKey = item.source?.relativePath ?? "[No React Source]";
        if (!byFile.has(fileKey)) {
          byFile.set(fileKey, []);
        }
        byFile.get(fileKey)!.push(item);
      }

      // Sort files alphabetically, but put [No React Source] last
      const sortedFiles = Array.from(byFile.keys()).sort((a, b) => {
        if (a === "[No React Source]") return 1;
        if (b === "[No React Source]") return -1;
        return a.localeCompare(b);
      });

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
          // Check if this is a multi-select (componentName like "3 elements: ...")
          const isMultiSelect = /^\d+ elements:/.test(item.componentName);

          if (isMultiSelect) {
            // Multi-select: use "Multiple Elements" header, elements have inline line numbers
            lines.push(`### Multiple Elements`);
            lines.push(`${prefix} ${item.content}`);
            lines.push(`  *(${item.componentName})*`);
          } else if (item.source) {
            // Single element with source - line number already in componentName
            lines.push(`### ${item.componentName}`);
            lines.push(`${prefix} ${item.content}`);
          } else if (item.devflowId) {
            // RadFlow UI element (devflow-id)
            lines.push(`### ${item.devflowId}`);
            lines.push(`${prefix} ${item.content}`);
          } else {
            // No source - use component name and selector info
            lines.push(`### ${item.componentName}`);
            lines.push(`${prefix} ${item.content}`);
          }

          // Add rich context if available
          if (item.richContext) {
            lines.push("");
            lines.push(...formatRichContext(item.richContext, item.elementSelector));
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
