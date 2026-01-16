import { useAppStore } from "../stores/appStore";

/**
 * UndoRedoControls - UI for undo/redo buttons and change count indicator.
 *
 * Displays:
 * - Undo button (disabled when no changes to undo)
 * - Redo button (disabled when no changes to redo)
 * - Change count indicator
 *
 * Keyboard shortcuts are handled by useKeyboardShortcuts hook:
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 */
export function UndoRedoControls() {
  const styleUndoStack = useAppStore((s) => s.styleUndoStack);
  const styleRedoStack = useAppStore((s) => s.styleRedoStack);
  const undoStyleChange = useAppStore((s) => s.undoStyleChange);
  const redoStyleChange = useAppStore((s) => s.redoStyleChange);

  const undoCount = styleUndoStack.length;
  const redoCount = styleRedoStack.length;
  const totalChanges = undoCount + redoCount;
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  const handleUndo = () => {
    undoStyleChange();
    // Note: Style application to iframe is handled by the component
    // that uses useUndoRedo with an onApplyStyle callback
  };

  const handleRedo = () => {
    redoStyleChange();
  };

  // Don't render if no changes have been made
  if (totalChanges === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Undo button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
          canUndo
            ? "bg-background/50 text-text hover:bg-background/70"
            : "bg-background/30 text-text-muted/50 cursor-not-allowed"
        }`}
        title={canUndo ? `Undo (${undoCount} change${undoCount !== 1 ? "s" : ""})` : "Nothing to undo"}
      >
        <span className="text-[10px]">◀</span>
        <span>Undo</span>
      </button>

      {/* Redo button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
          canRedo
            ? "bg-background/50 text-text hover:bg-background/70"
            : "bg-background/30 text-text-muted/50 cursor-not-allowed"
        }`}
        title={canRedo ? `Redo (${redoCount} change${redoCount !== 1 ? "s" : ""})` : "Nothing to redo"}
      >
        <span>Redo</span>
        <span className="text-[10px]">▶</span>
      </button>

      {/* Change count indicator */}
      <span className="text-xs text-text-muted ml-1">
        {totalChanges} change{totalChanges !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

/**
 * Compact version for tight spaces (e.g., status bar).
 */
export function UndoRedoIndicator() {
  const styleUndoStack = useAppStore((s) => s.styleUndoStack);
  const styleRedoStack = useAppStore((s) => s.styleRedoStack);

  const totalChanges = styleUndoStack.length + styleRedoStack.length;

  if (totalChanges === 0) {
    return null;
  }

  return (
    <span className="text-xs text-text-muted" title="Style changes in this session (Cmd+Z to undo)">
      {totalChanges} unsaved change{totalChanges !== 1 ? "s" : ""}
    </span>
  );
}

export default UndoRedoControls;
