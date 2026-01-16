/**
 * useFileWrite hook - SUNSET per fn-9 (context engineering pivot)
 *
 * This hook previously provided file write functionality.
 * Direct file writes have been removed in favor of clipboard-based
 * context output for LLM tools.
 *
 * This stub remains for API compatibility during transition.
 * Components should migrate to clipboard-only workflows.
 */

import { useCallback, useState } from "react";
import type { StyleEdit } from "../stores/slices/editsSlice";

// Stub types for API compatibility
export interface DiffEntry {
  relativePath: string;
  line: number;
  property: string;
  oldLine: string;
  newLine: string;
}

export interface DiffPreviewResult {
  success: boolean;
  diffs: DiffEntry[];
  error: string | null;
}

export interface WriteResult {
  success: boolean;
  filesModified: string[];
  backupPath: string | null;
  error: string | null;
  fileErrors: Record<string, string>;
}

/**
 * Stub hook - file write functionality removed per fn-9.
 * Returns no-op functions that indicate the feature is sunset.
 */
export function useFileWrite(_projectRoot: string) {
  const [isWriting] = useState(false);
  const [isPreviewing] = useState(false);
  const [lastBackupPath] = useState<string | null>(null);
  const [lastError] = useState<string | null>(
    "Direct file writes are disabled. Use clipboard mode instead."
  );

  // Stub: Always returns error indicating feature is sunset
  const previewEdits = useCallback(
    async (_edits: StyleEdit[]): Promise<DiffPreviewResult> => {
      return {
        success: false,
        diffs: [],
        error: "Direct file writes are disabled per fn-9. Use clipboard mode.",
      };
    },
    []
  );

  // Stub: Always returns error indicating feature is sunset
  const writeEdits = useCallback(
    async (_edits: StyleEdit[]): Promise<WriteResult> => {
      return {
        success: false,
        filesModified: [],
        backupPath: null,
        error: "Direct file writes are disabled per fn-9. Use clipboard mode.",
        fileErrors: {},
      };
    },
    []
  );

  // Stub: Always returns error indicating feature is sunset
  const restoreBackup = useCallback(
    async (_backupPath?: string): Promise<WriteResult> => {
      return {
        success: false,
        filesModified: [],
        backupPath: null,
        error: "Backup restore is disabled per fn-9.",
        fileErrors: {},
      };
    },
    []
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
