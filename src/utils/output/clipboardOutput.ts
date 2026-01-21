/**
 * Clipboard Output Implementation
 *
 * Implements IDesignOutput for clipboard-based output.
 * This is the current/default behavior - copies CSS to system clipboard.
 *
 * Implementation: fn-2-gnc.8
 */

import type {
  IDesignOutput,
  OutputTarget,
  CompileOptions,
  PersistOptions,
  PersistResult,
} from "../../types/output";
import type { StyleEdit } from "../../stores/types";

/**
 * Clipboard output implementation.
 *
 * Compiles style edits to CSS format and copies to system clipboard.
 * This preserves the current RadFlow behavior where changes are
 * accumulated and copied for the user to paste into their code.
 */
export class ClipboardOutput implements IDesignOutput {
  /**
   * Compile style edits to CSS format.
   *
   * @param edits - Array of style edits to compile
   * @param options - Compilation options
   * @returns CSS string ready for clipboard
   */
  compile(edits: StyleEdit[], options: CompileOptions = {}): string {
    if (edits.length === 0) {
      return "";
    }

    const {
      includeFilePaths = true,
      includeTimestamps = false,
      format = "css",
      groupByFile = true,
    } = options;

    if (format === "diff") {
      return this.compileToDiff(edits, { includeFilePaths, includeTimestamps });
    }

    if (groupByFile) {
      return this.compileGroupedByFile(edits, {
        includeFilePaths,
        includeTimestamps,
      });
    }

    return this.compileFlatList(edits, { includeFilePaths, includeTimestamps });
  }

  /**
   * Persist content to clipboard.
   *
   * @param content - CSS content to copy
   * @param options - Persistence options
   * @returns Result of the clipboard operation
   */
  async persist(
    content: string,
    options: PersistOptions
  ): Promise<PersistResult> {
    const { target, showNotification = true } = options;

    // Only handle clipboard target
    if (target === "file") {
      return {
        success: false,
        target,
        error: "ClipboardOutput does not support file target. Use FileOutput.",
      };
    }

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        target: "clipboard",
        error: "No content to copy",
      };
    }

    try {
      await navigator.clipboard.writeText(content);

      return {
        success: true,
        target: "clipboard",
        bytesWritten: content.length,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown clipboard error";
      console.error("Failed to copy to clipboard:", err);

      return {
        success: false,
        target: "clipboard",
        error: errorMessage,
      };
    }
  }

  /**
   * Rollback is not supported for clipboard output.
   * Once copied, the clipboard content is out of our control.
   */
  async rollback(): Promise<void> {
    // No-op for clipboard - can't undo a clipboard copy
    console.warn("Rollback not supported for clipboard output");
  }

  /**
   * Check if this implementation supports the given target.
   */
  supportsTarget(target: OutputTarget): boolean {
    return target === "clipboard" || target === "both";
  }

  // =========================================================================
  // Private compilation methods
  // =========================================================================

  /**
   * Compile edits grouped by file path.
   */
  private compileGroupedByFile(
    edits: StyleEdit[],
    options: { includeFilePaths: boolean; includeTimestamps: boolean }
  ): string {
    const { includeFilePaths, includeTimestamps } = options;

    // Group edits by file
    const byFile = new Map<string, StyleEdit[]>();
    for (const edit of edits) {
      const filePath = edit.source.filePath;
      const existing = byFile.get(filePath) || [];
      byFile.set(filePath, [...existing, edit]);
    }

    const sections: string[] = [];

    for (const [filePath, fileEdits] of byFile) {
      const lines: string[] = [];

      if (includeFilePaths) {
        lines.push(`/* ${filePath} */`);
      }

      // Group by component within file
      const byComponent = new Map<string, StyleEdit[]>();
      for (const edit of fileEdits) {
        const existing = byComponent.get(edit.componentName) || [];
        byComponent.set(edit.componentName, [...existing, edit]);
      }

      for (const [componentName, componentEdits] of byComponent) {
        lines.push(`/* ${componentName} */`);

        for (const edit of componentEdits) {
          const cssLine = `${edit.property}: ${edit.newValue};`;
          if (includeTimestamps) {
            const timestamp = new Date(edit.timestamp).toISOString();
            lines.push(`${cssLine} /* ${timestamp} */`);
          } else {
            lines.push(cssLine);
          }
        }
      }

      sections.push(lines.join("\n"));
    }

    return sections.join("\n\n");
  }

  /**
   * Compile edits as a flat list.
   */
  private compileFlatList(
    edits: StyleEdit[],
    options: { includeFilePaths: boolean; includeTimestamps: boolean }
  ): string {
    const { includeFilePaths, includeTimestamps } = options;

    const lines: string[] = [];

    for (const edit of edits) {
      const parts: string[] = [];

      if (includeFilePaths) {
        parts.push(`/* ${edit.source.relativePath}:${edit.source.line} */`);
      }

      const cssLine = `${edit.property}: ${edit.newValue};`;
      parts.push(cssLine);

      if (includeTimestamps) {
        const timestamp = new Date(edit.timestamp).toISOString();
        parts.push(`/* ${timestamp} */`);
      }

      lines.push(parts.join(" "));
    }

    return lines.join("\n");
  }

  /**
   * Compile edits to unified diff format.
   */
  private compileToDiff(
    edits: StyleEdit[],
    options: { includeFilePaths: boolean; includeTimestamps: boolean }
  ): string {
    const { includeFilePaths } = options;

    // Group by file for diff format
    const byFile = new Map<string, StyleEdit[]>();
    for (const edit of edits) {
      const filePath = edit.source.filePath;
      const existing = byFile.get(filePath) || [];
      byFile.set(filePath, [...existing, edit]);
    }

    const diffs: string[] = [];

    for (const [filePath, fileEdits] of byFile) {
      const lines: string[] = [];

      if (includeFilePaths) {
        lines.push(`--- a/${filePath}`);
        lines.push(`+++ b/${filePath}`);
      }

      for (const edit of fileEdits) {
        lines.push(`@@ -${edit.source.line} +${edit.source.line} @@`);
        lines.push(`-${edit.property}: ${edit.oldValue};`);
        lines.push(`+${edit.property}: ${edit.newValue};`);
      }

      diffs.push(lines.join("\n"));
    }

    return diffs.join("\n\n");
  }
}

/**
 * Singleton instance for convenience.
 */
export const clipboardOutput = new ClipboardOutput();
