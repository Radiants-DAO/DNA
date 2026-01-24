import type { StateCreator } from "zustand";
import type { AppState, SmartAnnotateSlice, SmartAnnotation, RichContext } from "../types";

// ============================================================================
// Helper Functions for Markdown Formatting
// ============================================================================

/**
 * Format computed styles as CSS-like block.
 */
function formatComputedStyles(styles: Record<string, string>): string[] {
  const lines: string[] = [];
  const entries = Object.entries(styles).slice(0, 8);
  if (entries.length === 0) return lines;

  lines.push("  ```css");
  for (const [prop, value] of entries) {
    // Convert camelCase to kebab-case
    const kebab = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    lines.push(`  ${kebab}: ${value};`);
  }
  lines.push("  ```");
  return lines;
}

/**
 * Format text diff for inline edits.
 */
function formatTextDiff(original: string, edited: string): string[] {
  const lines: string[] = [];
  lines.push(`  **Text Change:**`);
  lines.push(`  - Before: "${original.slice(0, 100)}${original.length > 100 ? "..." : ""}"`);
  lines.push(`  - After: "${edited.slice(0, 100)}${edited.length > 100 ? "..." : ""}"`);
  return lines;
}

/**
 * Format rich context inherited from comment mode.
 */
function formatRichContext(ctx: RichContext, selector: string): string[] {
  const lines: string[] = [];

  const provenanceLabel = ctx.provenanceDetail
    ? `${ctx.provenance} - ${ctx.provenanceDetail}`
    : ctx.provenance;
  lines.push(`  **Source** (${provenanceLabel}):`);

  if (ctx.fiberType) {
    const typeLabel = ctx.fiberType === "forward_ref" ? "forwardRef" : ctx.fiberType;
    lines.push(`  - Type: ${typeLabel} component`);
  }

  if (ctx.parentChain && ctx.parentChain.length > 0) {
    lines.push(`  - Parents: ${ctx.parentChain.slice(0, 4).join(" → ")}`);
  }

  if (ctx.provenance === "fiber" || ctx.provenance === "dom") {
    lines.push(`  - Selector: \`${selector}\``);
  }

  return lines;
}

/**
 * Smart Annotate Slice
 *
 * Enhanced annotation mode inspired by Agentation:
 * - Text selection capture
 * - Inline DOM editing (before/after diff)
 * - Nearby text/element context
 * - Computed styles capture
 * - Accessibility attributes
 *
 * Key differentiator: "Show don't tell" - edit text directly instead of describing changes.
 */
export const createSmartAnnotateSlice: StateCreator<
  AppState,
  [],
  [],
  SmartAnnotateSlice
> = (set, get) => ({
  smartAnnotations: [],
  smartAnnotateActive: false,
  hoveredSmartElement: null,
  selectedSmartElements: [],
  editingElementSelector: null,
  editingOriginalText: null,

  setSmartAnnotateActive: (active) => {
    if (active) {
      set({
        smartAnnotateActive: true,
        editorMode: "smart-annotate",
        componentIdMode: false,
        textEditMode: false,
        previewMode: false,
      });
    } else {
      set({
        smartAnnotateActive: false,
        hoveredSmartElement: null,
        selectedSmartElements: [],
        editingElementSelector: null,
        editingOriginalText: null,
      });
    }
  },

  addSmartAnnotation: (annotation) => {
    const newAnnotation: SmartAnnotation = {
      ...annotation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      smartAnnotations: [...state.smartAnnotations, newAnnotation],
      selectedSmartElements: [],
    }));
  },

  updateSmartAnnotation: (id, updates) => {
    set((state) => ({
      smartAnnotations: state.smartAnnotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  removeSmartAnnotation: (id) => {
    set((state) => ({
      smartAnnotations: state.smartAnnotations.filter((a) => a.id !== id),
    }));
  },

  clearSmartAnnotations: () => {
    set({
      smartAnnotations: [],
      selectedSmartElements: [],
      hoveredSmartElement: null,
    });
  },

  setHoveredSmartElement: (selector) => {
    set({ hoveredSmartElement: selector });
  },

  setSelectedSmartElement: (selector) => {
    set({ selectedSmartElements: selector ? [selector] : [] });
  },

  toggleSelectedSmartElement: (selector) => {
    set((state) => {
      const current = state.selectedSmartElements;
      const index = current.indexOf(selector);
      if (index >= 0) {
        return { selectedSmartElements: current.filter((s) => s !== selector) };
      } else {
        return { selectedSmartElements: [...current, selector] };
      }
    });
  },

  clearSelectedSmartElements: () => {
    set({ selectedSmartElements: [] });
  },

  // Inline editing - for "show don't tell" text changes
  startInlineEdit: (selector, originalText) => {
    set({
      editingElementSelector: selector,
      editingOriginalText: originalText,
    });
  },

  finishInlineEdit: (editedText) => {
    const { editingElementSelector, editingOriginalText } = get();
    if (!editingElementSelector || !editingOriginalText) return;

    // Only create annotation if text actually changed
    if (editedText !== editingOriginalText) {
      // Find existing annotation for this element or create new
      const existing = get().smartAnnotations.find(
        (a) => a.selector === editingElementSelector
      );

      if (existing) {
        get().updateSmartAnnotation(existing.id, {
          originalText: editingOriginalText,
          editedText,
        });
      } else {
        // Create minimal annotation for the edit
        get().addSmartAnnotation({
          x: 0,
          y: 0,
          element: "Text",
          elementPath: "",
          selector: editingElementSelector,
          originalText: editingOriginalText,
          editedText,
        });
      }
    }

    set({
      editingElementSelector: null,
      editingOriginalText: null,
    });
  },

  cancelInlineEdit: () => {
    set({
      editingElementSelector: null,
      editingOriginalText: null,
    });
  },

  compileSmartToMarkdown: () => {
    const { smartAnnotations } = get();

    if (smartAnnotations.length === 0) {
      return "No smart annotations to compile.";
    }

    const lines: string[] = [];
    lines.push("# Smart Annotations");
    lines.push("");

    // Group by source file
    const byFile = new Map<string, SmartAnnotation[]>();
    for (const annotation of smartAnnotations) {
      const fileKey = annotation.source?.relativePath ?? "[No Source]";
      if (!byFile.has(fileKey)) {
        byFile.set(fileKey, []);
      }
      byFile.get(fileKey)!.push(annotation);
    }

    // Sort files, [No Source] last
    const sortedFiles = Array.from(byFile.keys()).sort((a, b) => {
      if (a === "[No Source]") return 1;
      if (b === "[No Source]") return -1;
      return a.localeCompare(b);
    });

    for (const filePath of sortedFiles) {
      const annotations = byFile.get(filePath)!;

      // Sort by timestamp
      annotations.sort((a, b) => a.timestamp - b.timestamp);

      lines.push(`## ${filePath}`);
      lines.push("");

      for (const ann of annotations) {
        // Header with element name
        const lineInfo = ann.source ? `: line ${ann.source.line}` : "";
        lines.push(`### ${ann.element}${lineInfo}`);

        // Text edit diff (the key "smart" feature)
        if (ann.originalText && ann.editedText) {
          lines.push(...formatTextDiff(ann.originalText, ann.editedText));
          lines.push("");
        }

        // Selected text (quoted)
        if (ann.selectedText) {
          lines.push(`  > "${ann.selectedText.slice(0, 100)}${ann.selectedText.length > 100 ? "..." : ""}"`);
          lines.push("");
        }

        // Traditional comment
        if (ann.comment) {
          lines.push(`- ${ann.comment}`);
          lines.push("");
        }

        // Nearby context
        if (ann.nearbyText) {
          lines.push(`  **Nearby text:** "${ann.nearbyText.slice(0, 80)}..."`);
        }

        // CSS classes
        if (ann.cssClasses) {
          lines.push(`  **Classes:** \`${ann.cssClasses}\``);
        }

        // Computed styles (optional, can be verbose)
        if (ann.computedStyles && Object.keys(ann.computedStyles).length > 0) {
          lines.push("");
          lines.push(...formatComputedStyles(ann.computedStyles));
        }

        // Accessibility
        if (ann.accessibility) {
          lines.push(`  **A11y:** ${ann.accessibility}`);
        }

        // Rich context from bridge/fiber
        if (ann.richContext) {
          lines.push("");
          lines.push(...formatRichContext(ann.richContext, ann.selector));
        }

        // Selector as fallback
        if (!ann.richContext && ann.selector) {
          lines.push(`  *Selector: \`${ann.selector}\`*`);
        }

        lines.push("");
      }
    }

    return lines.join("\n");
  },

  copySmartToClipboard: async () => {
    const markdown = get().compileSmartToMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (err) {
      console.error("Failed to copy smart annotations to clipboard:", err);
    }
  },
});
