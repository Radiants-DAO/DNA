"use client";

import { Button, Tooltip } from "@rdna/radiants/components/core";
import {
  MousePointer2,
  Type,
  Eye,
  MessageCircle,
  HelpCircle,
  Palette,
  Grid3X3,
  Layout,
  FontAaIcon,
} from "@rdna/radiants/icons";

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

export function ModeToolbar({
  editorMode,
  onSetEditorMode,
  activeFeedbackType,
  onSetActiveFeedbackType,
  activePanel,
  onTogglePanel,
}: ModeToolbarProps) {
  return (
    <div
      className="flex items-center gap-0.5 bg-surface-primary/80 backdrop-blur-sm border border-edge-primary rounded-sm px-0.5 py-0.5"
      data-playground-id="mode-toolbar"
    >
      {/* Mode buttons */}
      <Tooltip content="Select (V)" position="top">
        <Button
          variant={editorMode === "component-id" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<MousePointer2 size={16} />}
          aria-label="Select"
          onClick={() => onSetEditorMode("component-id")}
        />
      </Tooltip>

      <Tooltip content="Text (T)" position="top">
        <Button
          variant={editorMode === "text-edit" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<Type size={16} />}
          aria-label="Text"
          onClick={() => onSetEditorMode("text-edit")}
        />
      </Tooltip>

      <Tooltip content="Preview (P)" position="top">
        <Button
          variant={editorMode === "preview" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<Eye size={16} />}
          aria-label="Preview"
          onClick={() => onSetEditorMode("preview")}
        />
      </Tooltip>

      <Tooltip content="Comment (C)" position="top">
        <Button
          variant={editorMode === "comment" && activeFeedbackType === "comment" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<MessageCircle size={16} />}
          aria-label="Comment"
          onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("comment"); }}
        />
      </Tooltip>

      <Tooltip content="Question (Q)" position="top">
        <Button
          variant={editorMode === "comment" && activeFeedbackType === "question" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<HelpCircle size={16} />}
          aria-label="Question"
          onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("question"); }}
        />
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-edge-muted mx-0.5" />

      {/* Panel toggles */}
      <Tooltip content="Colors" position="top">
        <Button
          variant={activePanel === "colors" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<Palette size={16} />}
          aria-label="Colors"
          onClick={() => onTogglePanel("colors")}
        />
      </Tooltip>

      <Tooltip content="Typography" position="top">
        <Button
          variant={activePanel === "typography" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<FontAaIcon size={16} />}
          aria-label="Typography"
          onClick={() => onTogglePanel("typography")}
        />
      </Tooltip>

      <Tooltip content="Spacing" position="top">
        <Button
          variant={activePanel === "spacing" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<Grid3X3 size={16} />}
          aria-label="Spacing"
          onClick={() => onTogglePanel("spacing")}
        />
      </Tooltip>

      <Tooltip content="Layout" position="top">
        <Button
          variant={activePanel === "layout" ? "secondary" : "text"}
          size="md"
          iconOnly
          icon={<Layout size={16} />}
          aria-label="Layout"
          onClick={() => onTogglePanel("layout")}
        />
      </Tooltip>
    </div>
  );
}
