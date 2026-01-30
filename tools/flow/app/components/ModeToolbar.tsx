import { useAppStore } from "../stores/appStore";
import type { EditorMode, PanelType } from "../stores/types";
import { Palette, Type, Grid3X3, Layout, MessageCircle, HelpCircle } from "./ui/icons";

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
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const setActiveFeedbackType = useAppStore((s) => s.setActiveFeedbackType);
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="flex items-center gap-2" data-devflow-id="mode-toolbar">
      {/* Mode buttons */}
      <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1" data-devflow-id="mode-buttons">
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
        <ModeButton
          mode="comment"
          label="Comment"
          shortcut="C"
          active={editorMode === "comment" && activeFeedbackType === "comment"}
          onClick={() => setActiveFeedbackType("comment")}
        />
        <ModeButton
          mode="comment"
          label="Question"
          shortcut="Q"
          active={editorMode === "comment" && activeFeedbackType === "question"}
          onClick={() => setActiveFeedbackType("question")}
        />
      </div>

      {/* Property panels */}
      <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1" data-devflow-id="panel-buttons">
        <PanelButton
          panel="colors"
          label="Colors"
          icon={<Palette className="w-4 h-4" />}
          active={activePanel === "colors"}
          onClick={() => togglePanel("colors")}
        />
        <PanelButton
          panel="typography"
          label="Type"
          icon={<Type className="w-4 h-4" />}
          active={activePanel === "typography"}
          onClick={() => togglePanel("typography")}
        />
        <PanelButton
          panel="spacing"
          label="Spacing"
          icon={<Grid3X3 className="w-4 h-4" />}
          active={activePanel === "spacing"}
          onClick={() => togglePanel("spacing")}
        />
        <PanelButton
          panel="layout"
          label="Layout"
          icon={<Layout className="w-4 h-4" />}
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

/**
 * Floating mode indicator shown in comment/question mode.
 * Shows feedback count and shortcuts.
 */
export function CommentModeIndicator() {
  const editorMode = useAppStore((s) => s.editorMode);
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const setActiveFeedbackType = useAppStore((s) => s.setActiveFeedbackType);
  const comments = useAppStore((s) => s.comments);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);

  if (editorMode !== "comment") {
    return null;
  }

  const isQuestion = activeFeedbackType === "question";
  const commentCount = comments.filter((c) => c.type === "comment").length;
  const questionCount = comments.filter((c) => c.type === "question").length;
  const totalCount = comments.length;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Copy button */}
      {totalCount > 0 && (
        <button
          onClick={() => copyCommentsToClipboard()}
          className="
            bg-gray-700 text-white px-4 py-2 rounded-lg
            text-sm flex items-center gap-2
            hover:bg-gray-600 transition-colors
            shadow-lg
          "
        >
          <span>
            Copy {commentCount > 0 && `${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
            {commentCount > 0 && questionCount > 0 && ' + '}
            {questionCount > 0 && `${questionCount} question${questionCount !== 1 ? 's' : ''}`}
          </span>
          <kbd className="bg-white/20 px-1.5 rounded text-xs">Shift+Cmd+C</kbd>
        </button>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1">
        {/* Radiants colors: sky-blue for comments, sunset-fuzz for questions */}
        <button
          onClick={() => setActiveFeedbackType("comment")}
          className={`
            px-4 py-2 rounded-l-lg text-sm flex items-center gap-2 transition-colors shadow-lg
            ${!isQuestion
              ? "bg-[#95BAD2] text-content-inverted"
              : "bg-surface-primary/60 text-content-primary/70 hover:bg-surface-primary/80"
            }
          `}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
          <kbd className="bg-white/20 px-1.5 rounded text-xs">C</kbd>
        </button>
        <button
          onClick={() => setActiveFeedbackType("question")}
          className={`
            px-4 py-2 rounded-r-lg text-sm flex items-center gap-2 transition-colors shadow-lg
            ${isQuestion
              ? "bg-[#FCC383] text-content-inverted"
              : "bg-surface-primary/60 text-content-primary/70 hover:bg-surface-primary/80"
            }
          `}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Question</span>
          <kbd className="bg-white/20 px-1.5 rounded text-xs">Q</kbd>
        </button>
      </div>

      {/* Exit button */}
      <button
        onClick={() => setEditorMode("component-id")}
        className="
          bg-black/80 text-white px-4 py-2 rounded-lg
          text-sm flex items-center gap-2
          hover:bg-black/90 transition-colors
          shadow-lg
        "
      >
        <kbd className="bg-white/20 px-1.5 rounded text-xs">Esc</kbd>
        <span className="text-white/60">to exit</span>
      </button>
    </div>
  );
}

