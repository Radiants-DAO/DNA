import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useFileWrite, type DiffEntry } from "../hooks/useFileWrite";
import type { StyleEdit } from "../stores/slices/editingSlice";

interface DiffPreviewModalProps {
  diffs: DiffEntry[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWriting: boolean;
}

/**
 * Modal to show diff preview before writing.
 */
function DiffPreviewModal({
  diffs,
  isOpen,
  onClose,
  onConfirm,
  isWriting,
}: DiffPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-text">Review Changes</h2>
          <p className="text-sm text-text-muted mt-1">
            {diffs.length} change{diffs.length !== 1 ? "s" : ""} will be applied
          </p>
        </div>

        {/* Diff List */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {diffs.map((diff, idx) => (
            <div key={idx} className="bg-black/20 rounded-lg overflow-hidden">
              {/* File header */}
              <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm text-text-muted font-mono">
                  {diff.relativePath}:{diff.line}
                </span>
                <span className="text-xs text-primary">{diff.property}</span>
              </div>
              {/* Diff content */}
              <div className="p-3 space-y-2 font-mono text-sm">
                <div className="flex">
                  <span className="text-red-400 w-6 flex-shrink-0">-</span>
                  <span className="text-red-300 break-all">{diff.oldLine}</span>
                </div>
                <div className="flex">
                  <span className="text-green-400 w-6 flex-shrink-0">+</span>
                  <span className="text-green-300 break-all">{diff.newLine}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isWriting}
            className="px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isWriting}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isWriting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isWriting ? "Writing..." : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditItemProps {
  edit: StyleEdit;
  onRemove: (id: string) => void;
}

/**
 * Single edit item in the list.
 */
function EditItem({ edit, onRemove }: EditItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-text truncate">
            {edit.componentName}
          </span>
          <span className="text-xs text-text-muted">•</span>
          <span className="text-xs text-primary">{edit.property}</span>
        </div>
        <div className="text-xs text-text-muted font-mono truncate">
          {edit.source.relativePath}:{edit.source.line}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-red-400 line-through">{edit.oldValue}</span>
          <span className="text-text-muted">→</span>
          <span className="text-green-400">{edit.newValue}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(edit.id)}
        className="p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove edit"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export interface EditClipboardProps {
  /** Project root path for file writes */
  projectRoot: string;
  /** Callback when edits are successfully saved */
  onSaved?: () => void;
}

/**
 * EditClipboard - Panel for viewing and managing accumulated style edits.
 *
 * Features:
 * - List of pending style edits
 * - Diff preview before writing
 * - Save all edits to source files
 * - Undo last edit
 * - Clear all edits
 *
 * Implementation: fn-5.6
 */
export function EditClipboard({ projectRoot, onSaved }: EditClipboardProps) {
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Store state
  const pendingStyleEdits = useAppStore((s) => s.pendingStyleEdits);
  const removeStyleEdit = useAppStore((s) => s.removeStyleEdit);
  const undoLastStyleEdit = useAppStore((s) => s.undoLastStyleEdit);
  const clearAllStyleEdits = useAppStore((s) => s.clearAllStyleEdits);

  // File write hook
  const {
    previewEdits,
    writeEdits,
    isWriting,
    isPreviewing,
    lastBackupPath,
    lastError,
  } = useFileWrite(projectRoot);

  // Group edits by file for display
  const editsByFile = useMemo(() => {
    const grouped = new Map<string, StyleEdit[]>();
    for (const edit of pendingStyleEdits) {
      const key = edit.source.relativePath;
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, edit]);
    }
    return grouped;
  }, [pendingStyleEdits]);

  // Handle save button click
  const handleSaveClick = useCallback(async () => {
    setPreviewError(null);
    const result = await previewEdits(pendingStyleEdits);

    if (result.success) {
      setDiffs(result.diffs);
      setShowDiffPreview(true);
    } else {
      setPreviewError(result.error || "Failed to generate preview");
    }
  }, [previewEdits, pendingStyleEdits]);

  // Handle confirm write
  const handleConfirmWrite = useCallback(async () => {
    const result = await writeEdits(pendingStyleEdits);

    if (result.success) {
      setShowDiffPreview(false);
      clearAllStyleEdits();
      onSaved?.();
    }
  }, [writeEdits, pendingStyleEdits, clearAllStyleEdits, onSaved]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undoLastStyleEdit();
  }, [undoLastStyleEdit]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (pendingStyleEdits.length > 0) {
      clearAllStyleEdits();
    }
  }, [clearAllStyleEdits, pendingStyleEdits.length]);

  const editCount = pendingStyleEdits.length;
  const fileCount = editsByFile.size;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">Edit Clipboard</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {editCount === 0
                ? "No pending edits"
                : `${editCount} edit${editCount !== 1 ? "s" : ""} in ${fileCount} file${fileCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          {editCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                className="p-1.5 text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors"
                title="Undo last edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleClearAll}
                className="p-1.5 text-text-muted hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                title="Clear all edits"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit List */}
      <div className="flex-1 overflow-auto p-4">
        {editCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">
              Style changes will appear here
            </p>
            <p className="text-xs text-text-muted mt-1">
              Edit styles in the preview to add them
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(editsByFile.entries()).map(([filePath, edits]) => (
              <div key={filePath}>
                <div className="text-xs text-text-muted font-mono mb-2 truncate">
                  {filePath}
                </div>
                <div className="space-y-2">
                  {edits.map((edit) => (
                    <EditItem
                      key={edit.id}
                      edit={edit}
                      onRemove={removeStyleEdit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {(previewError || lastError) && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{previewError || lastError}</p>
        </div>
      )}

      {/* Footer with Save Button */}
      {editCount > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={handleSaveClick}
            disabled={isPreviewing || isWriting}
            className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPreviewing && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isPreviewing ? "Generating Preview..." : "Review & Save"}
          </button>
          {lastBackupPath && (
            <p className="text-xs text-text-muted mt-2 text-center">
              Last backup: {lastBackupPath.split("/").pop()}
            </p>
          )}
        </div>
      )}

      {/* Diff Preview Modal */}
      <DiffPreviewModal
        diffs={diffs}
        isOpen={showDiffPreview}
        onClose={() => setShowDiffPreview(false)}
        onConfirm={handleConfirmWrite}
        isWriting={isWriting}
      />
    </div>
  );
}

export default EditClipboard;
