"use client";

import { Palette, Type, Grid3X3, Layout, MessageCircle, HelpCircle } from "@rdna/radiants/icons";

export type EditorMode =
  | "cursor"
  | "component-id"
  | "text-edit"
  | "preview"
  | "comment";

export type PanelType = "colors" | "typography" | "spacing" | "layout";

export type FeedbackType = "comment" | "question";

interface ModeToolbarProps {
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  activeFeedbackType: FeedbackType | null;
  onSetActiveFeedbackType: (type: FeedbackType) => void;
  activePanel: PanelType | null;
  onTogglePanel: (panel: PanelType) => void;
}

interface ModeButtonProps {
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}

function ModeButton({ label, shortcut, active, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2
        ${active
          ? "bg-content-primary text-surface-primary"
          : "bg-surface-secondary/50 hover:bg-surface-secondary text-content-primary"
        }
      `}
      title={`${label} (${shortcut})`}
    >
      <span>{label}</span>
      <kbd className={`text-xs px-1 rounded ${active ? "bg-surface-primary/20" : "bg-content-primary/10"}`}>
        {shortcut}
      </kbd>
    </button>
  );
}

interface PanelButtonProps {
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
          ? "bg-content-primary text-surface-primary"
          : "bg-surface-secondary/50 hover:bg-surface-secondary text-content-primary"
        }
      `}
      title={`Toggle ${label} panel`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function ModeToolbar({
  editorMode,
  onSetEditorMode,
  activeFeedbackType,
  onSetActiveFeedbackType,
  activePanel,
  onTogglePanel,
}: ModeToolbarProps) {
  return (
    <div className="flex items-center gap-2" data-playground-id="mode-toolbar">
      {/* Mode buttons */}
      <div className="flex items-center gap-1 bg-surface-primary/50 rounded-lg p-1">
        <ModeButton
          label="Select"
          shortcut="V"
          active={editorMode === "component-id"}
          onClick={() => onSetEditorMode("component-id")}
        />
        <ModeButton
          label="Text"
          shortcut="T"
          active={editorMode === "text-edit"}
          onClick={() => onSetEditorMode("text-edit")}
        />
        <ModeButton
          label="Preview"
          shortcut="P"
          active={editorMode === "preview"}
          onClick={() => onSetEditorMode("preview")}
        />
        <ModeButton
          label="Comment"
          shortcut="C"
          active={editorMode === "comment" && activeFeedbackType === "comment"}
          onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("comment"); }}
        />
        <ModeButton
          label="Question"
          shortcut="Q"
          active={editorMode === "comment" && activeFeedbackType === "question"}
          onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("question"); }}
        />
      </div>

      {/* Panel toggles */}
      <div className="flex items-center gap-1 bg-surface-primary/50 rounded-lg p-1">
        <PanelButton
          label="Colors"
          icon={<Palette className="w-4 h-4" />}
          active={activePanel === "colors"}
          onClick={() => onTogglePanel("colors")}
        />
        <PanelButton
          label="Type"
          icon={<Type className="w-4 h-4" />}
          active={activePanel === "typography"}
          onClick={() => onTogglePanel("typography")}
        />
        <PanelButton
          label="Spacing"
          icon={<Grid3X3 className="w-4 h-4" />}
          active={activePanel === "spacing"}
          onClick={() => onTogglePanel("spacing")}
        />
        <PanelButton
          label="Layout"
          icon={<Layout className="w-4 h-4" />}
          active={activePanel === "layout"}
          onClick={() => onTogglePanel("layout")}
        />
      </div>
    </div>
  );
}
