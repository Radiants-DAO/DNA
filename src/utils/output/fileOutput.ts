/**
 * File Output Implementation (Stub)
 *
 * Implements IDesignOutput for direct file writes.
 * This is a STUB for future implementation - returns not-implemented errors.
 *
 * Future implementation will:
 * - Use Tauri filesystem APIs for direct file writes
 * - Support backup creation before writes
 * - Support rollback via backup restore
 * - Handle concurrent file access safely
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
 * File output implementation (stub).
 *
 * This implementation returns not-implemented errors for all operations.
 * It exists to:
 * 1. Fulfill the IDesignOutput interface contract
 * 2. Provide a clear extension point for future file write support
 * 3. Allow the output system to be designed for both modes from day one
 */
export class FileOutput implements IDesignOutput {
  /**
   * Compile style edits to file-write format.
   *
   * For file output, this would generate the actual file content
   * to be written, potentially including the full file with edits applied.
   *
   * @param edits - Array of style edits to compile
   * @param options - Compilation options
   * @returns Compiled content (stub: returns placeholder)
   */
  compile(edits: StyleEdit[], options: CompileOptions = {}): string {
    // Stub: Return a placeholder indicating this is not implemented
    // In the future, this would:
    // 1. Read the original file content
    // 2. Apply the edits at the correct locations
    // 3. Return the modified file content

    if (edits.length === 0) {
      return "";
    }

    const lines: string[] = [
      "/* FileOutput compile() - NOT IMPLEMENTED */",
      "/* The following edits would be written to files: */",
      "",
    ];

    for (const edit of edits) {
      lines.push(
        `/* ${edit.source.relativePath}:${edit.source.line} */`
      );
      lines.push(`/* ${edit.property}: ${edit.oldValue} -> ${edit.newValue} */`);
    }

    return lines.join("\n");
  }

  /**
   * Persist content to file.
   *
   * STUB: Always returns not-implemented error.
   *
   * @param content - Content to write
   * @param options - Persistence options
   * @returns Result indicating not implemented
   */
  async persist(
    content: string,
    options: PersistOptions
  ): Promise<PersistResult> {
    const { target, filePath } = options;

    // Only handle file or both targets
    if (target === "clipboard") {
      return {
        success: false,
        target,
        error: "FileOutput does not support clipboard target. Use ClipboardOutput.",
      };
    }

    // Return not-implemented error
    return {
      success: false,
      target,
      error:
        "Direct file writes are not yet implemented. " +
        "This feature is planned for the Advanced panel mode. " +
        "Use clipboard mode for now.",
      filePath,
    };
  }

  /**
   * Rollback last file write.
   *
   * STUB: Logs warning that rollback is not implemented.
   *
   * Future implementation will:
   * 1. Check for backup file
   * 2. Restore backup to original location
   * 3. Remove backup file
   */
  async rollback(): Promise<void> {
    console.warn(
      "FileOutput rollback() not implemented. " +
        "Direct file writes are not yet supported."
    );
  }

  /**
   * Check if this implementation supports the given target.
   */
  supportsTarget(target: OutputTarget): boolean {
    return target === "file" || target === "both";
  }
}

/**
 * Singleton instance for convenience.
 */
export const fileOutput = new FileOutput();
