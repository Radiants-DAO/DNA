import { useAppStore } from "../stores/appStore";
import type { EditorMode } from "../stores/types";

interface ModeButtonProps {
  mode: EditorMode;
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}

function ModeButton({ mode, label, shortcut, active, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2
        ${active
          ? "bg-accent text-white"
          : "bg-surface hover:bg-surface/80 text-text"
        }
      `}
      title={`${label} (${shortcut})`}
    >
      <span>{label}</span>
      <kbd className={`
        text-xs px-1 rounded
        ${active ? "bg-white/20" : "bg-black/10"}
      `}>
        {shortcut}
      </kbd>
    </button>
  );
}

/**
 * Mode toolbar showing current mode and toggle buttons.
 *
 * Displays:
 * - Component ID mode (V)
 * - Text Edit mode (T)
 * - Preview mode (P)
 *
 * Only one mode can be active at a time.
 */
export function ModeToolbar() {
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);

  return (
    <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
      <ModeButton
        mode="component-id"
        label="Select"
        shortcut="V"
        active={editorMode === "component-id"}
        onClick={() => setEditorMode("component-id")}
      />
      <ModeButton
        mode="text-edit"
        label="Text"
        shortcut="T"
        active={editorMode === "text-edit"}
        onClick={() => setEditorMode("text-edit")}
      />
      <ModeButton
        mode="preview"
        label="Preview"
        shortcut="P"
        active={editorMode === "preview"}
        onClick={() => setEditorMode("preview")}
      />
    </div>
  );
}

/**
 * Floating mode indicator shown in preview mode.
 * Allows exiting preview mode via Escape key reminder.
 */
export function PreviewModeIndicator() {
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);

  if (editorMode !== "preview") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setEditorMode("component-id")}
        className="
          bg-black/80 text-white px-4 py-2 rounded-lg
          text-sm flex items-center gap-2
          hover:bg-black/90 transition-colors
          shadow-lg
        "
      >
        <span>Preview Mode</span>
        <kbd className="bg-white/20 px-1.5 rounded text-xs">Esc</kbd>
        <span className="text-white/60">to exit</span>
      </button>
    </div>
  );
}
