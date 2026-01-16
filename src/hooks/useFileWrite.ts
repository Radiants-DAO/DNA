import { useCallback, useState } from "react";
import {
  commands,
  type WriteResult as BindingWriteResult,
  type DiffPreviewResult as BindingDiffPreviewResult,
  type DiffEntry as BindingDiffEntry,
} from "../bindings";
import type { StyleEdit } from "../stores/slices/editsSlice";

/**
 * Input format for the Rust write_style_edits command.
 */
interface StyleEditInput {
  id: string;
  radflowId: string;
  componentName: string;
  filePath: string;
  line: number;
  column: number;
  property: string;
  oldValue: string;
  newValue: string;
}

// Re-export types from bindings
export type WriteResult = BindingWriteResult;
export type DiffEntry = BindingDiffEntry;
export type DiffPreviewResult = BindingDiffPreviewResult;

/**
 * Convert StyleEdit from store to input format for Rust command.
 */
function toStyleEditInput(edit: StyleEdit): StyleEditInput {
  return {
    id: edit.id,
    radflowId: edit.radflowId,
    componentName: edit.componentName,
    filePath: edit.source.filePath,
    line: edit.source.line,
    column: edit.source.column,
    property: edit.property,
    oldValue: edit.oldValue,
    newValue: edit.newValue,
  };
}

/**
 * Hook for writing style edits to source files.
 *
 * Provides:
 * - previewEdits: Generate diff preview without writing
 * - writeEdits: Write edits to files with backup
 * - restoreBackup: Restore from a backup
 *
 * Implementation: fn-5.6
 */
export function useFileWrite(projectRoot: string) {
  const [isWriting, setIsWriting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Generate a diff preview without writing files.
   */
  const previewEdits = useCallback(
    async (edits: StyleEdit[]): Promise<DiffPreviewResult> => {
      if (edits.length === 0) {
        return { success: true, diffs: [], error: null };
      }

      setIsPreviewing(true);
      setLastError(null);

      try {
        const inputs = edits.map(toStyleEditInput);
        const result = await commands.previewStyleEdits(inputs, projectRoot);

        if (!result.success) {
          setLastError(result.error || "Preview failed");
        }

        return result;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setLastError(error);
        return { success: false, diffs: [], error };
      } finally {
        setIsPreviewing(false);
      }
    },
    [projectRoot]
  );

  /**
   * Write style edits to source files with backup.
   */
  const writeEdits = useCallback(
    async (edits: StyleEdit[]): Promise<WriteResult> => {
      if (edits.length === 0) {
        return {
          success: true,
          filesModified: [],
          backupPath: null,
          error: null,
          fileErrors: {},
        };
      }

      setIsWriting(true);
      setLastError(null);

      try {
        const inputs = edits.map(toStyleEditInput);
        const result = await commands.writeStyleEdits(inputs, projectRoot);

        if (result.backupPath) {
          setLastBackupPath(result.backupPath);
        }

        if (!result.success) {
          setLastError(result.error || "Write failed");
        }

        return result;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setLastError(error);
        return {
          success: false,
          filesModified: [],
          backupPath: null,
          error,
          fileErrors: {},
        };
      } finally {
        setIsWriting(false);
      }
    },
    [projectRoot]
  );

  /**
   * Restore files from a backup.
   */
  const restoreBackup = useCallback(
    async (backupPath?: string): Promise<WriteResult> => {
      const path = backupPath || lastBackupPath;
      if (!path) {
        return {
          success: false,
          filesModified: [],
          backupPath: null,
          error: "No backup path provided",
          fileErrors: {},
        };
      }

      setIsWriting(true);
      setLastError(null);

      try {
        const result = await commands.restoreFromBackup(path, projectRoot);

        if (!result.success) {
          setLastError(result.error || "Restore failed");
        }

        return result;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setLastError(error);
        return {
          success: false,
          filesModified: [],
          backupPath: path,
          error,
          fileErrors: {},
        };
      } finally {
        setIsWriting(false);
      }
    },
    [projectRoot, lastBackupPath]
  );

  return {
    previewEdits,
    writeEdits,
    restoreBackup,
    isWriting,
    isPreviewing,
    lastBackupPath,
    lastError,
  };
}

export default useFileWrite;
