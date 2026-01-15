import { useAppStore } from "../stores/appStore";
import type { EditorMode, PanelType } from "../stores/types";

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
 * - Property panels toggle (Colors, etc.)
 *
 * Only one mode can be active at a time.
 */
export function ModeToolbar() {
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mode buttons */}
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

      {/* Property panels */}
      <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
        <PanelButton
          panel="colors"
          label="Colors"
          icon={<ColorSwatchIcon />}
          active={activePanel === "colors"}
          onClick={() => togglePanel("colors")}
        />
        <PanelButton
          panel="typography"
          label="Type"
          icon={<TypographyIcon />}
          active={activePanel === "typography"}
          onClick={() => togglePanel("typography")}
        />
        <PanelButton
          panel="spacing"
          label="Spacing"
          icon={<SpacingIcon />}
          active={activePanel === "spacing"}
          onClick={() => togglePanel("spacing")}
        />
        <PanelButton
          panel="layout"
          label="Layout"
          icon={<LayoutIcon />}
          active={activePanel === "layout"}
          onClick={() => togglePanel("layout")}
        />
      </div>
    </div>
  );
}

interface PanelButtonProps {
  panel: PanelType;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function PanelButton({ label, icon, active, onClick }: PanelButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5
        ${active
          ? "bg-accent text-white"
          : "bg-surface hover:bg-surface/80 text-text"
        }
      `}
      title={`Toggle ${label} panel`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ColorSwatchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  );
}

function TypographyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h10"
      />
    </svg>
  );
}

function SpacingIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
      <rect x="7" y="7" width="10" height="10" rx="1" strokeWidth={1.5} />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h14a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z"
      />
    </svg>
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
