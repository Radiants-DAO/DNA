"use client";

import { useState, useCallback } from "react";
import { IconButton, Tooltip, Combobox, Input } from "@rdna/radiants/components/core";
import {
  MousePointer2,
  Type,
  Eye,
  MessageCircle,
  HelpCircle,
  Palette,
  Grid3X3,
  FontAaIcon,
  Search,
} from "@rdna/radiants/icons";
import { registry } from "./registry";
import { isRenderable, type ForcedState } from "./types";

export type EditorMode =
  | "cursor"
  | "component-id"
  | "text-edit"
  | "preview"
  | "comment";

export type PanelType = "colors" | "typography" | "spacing";

export type FeedbackType = "comment" | "question";

const STATES: ForcedState[] = ["default", "hover", "active", "focus", "disabled"];

interface ModeToolbarProps {
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  activeFeedbackType: FeedbackType | null;
  onSetActiveFeedbackType: (type: FeedbackType) => void;
  activePanel: PanelType | null;
  onTogglePanel: (panel: PanelType) => void;
  forcedState: ForcedState;
  onSetForcedState: (state: ForcedState) => void;
  selectedPackage: string;
  onFocusNode: (registryId: string) => void;
}

export function ModeToolbar({
  editorMode,
  onSetEditorMode,
  activeFeedbackType,
  onSetActiveFeedbackType,
  activePanel,
  onTogglePanel,
  forcedState,
  onSetForcedState,
  selectedPackage,
  onFocusNode,
}: ModeToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
        return;
      }
      if (e.key !== "Enter" || !search.trim()) return;
      const match = registry.find(
        (entry) =>
          entry.packageName === selectedPackage &&
          isRenderable(entry) &&
          (
            entry.label.toLowerCase().includes(search.toLowerCase()) ||
            entry.componentName.toLowerCase().includes(search.toLowerCase())
          ),
      );
      if (match) {
        onFocusNode(match.id);
        setSearchOpen(false);
        setSearch("");
      }
    },
    [search, selectedPackage, onFocusNode],
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Search field — appears above toolbar when open */}
      {searchOpen && (
        <div className="bg-surface-primary/80 backdrop-blur-sm border border-edge-primary rounded-sm px-2 py-1.5 w-64">
          <Input
            placeholder="Find component…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            size="sm"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
      )}

      {/* Main toolbar */}
      <div
        className="flex items-center gap-0.5 bg-surface-primary/80 backdrop-blur-sm border border-edge-primary rounded-sm px-0.5 py-0.5"
        data-playground-id="mode-toolbar"
      >
        {/* Mode buttons */}
        <Tooltip content="Select (V)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<MousePointer2 size={16} />}
            aria-label="Select"
            active={editorMode === "component-id"}
            onClick={() => onSetEditorMode("component-id")}
          />
        </Tooltip>

        <Tooltip content="Text (T)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<Type size={16} />}
            aria-label="Text"
            active={editorMode === "text-edit"}
            onClick={() => onSetEditorMode("text-edit")}
          />
        </Tooltip>

        <Tooltip content="Preview (P)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<Eye size={16} />}
            aria-label="Preview"
            active={editorMode === "preview"}
            onClick={() => onSetEditorMode("preview")}
          />
        </Tooltip>

        <Tooltip content="Comment (C)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<MessageCircle size={16} />}
            aria-label="Comment"
            active={editorMode === "comment" && activeFeedbackType === "comment"}
            onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("comment"); }}
          />
        </Tooltip>

        <Tooltip content="Question (Q)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<HelpCircle size={16} />}
            aria-label="Question"
            active={editorMode === "comment" && activeFeedbackType === "question"}
            onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("question"); }}
          />
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-5 bg-edge-muted mx-0.5" />

        {/* Panel toggles */}
        <Tooltip content="Colors" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<Palette size={16} />}
            aria-label="Colors"
            active={activePanel === "colors"}
            onClick={() => onTogglePanel("colors")}
          />
        </Tooltip>

        <Tooltip content="Typography" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<FontAaIcon size={16} />}
            aria-label="Typography"
            active={activePanel === "typography"}
            onClick={() => onTogglePanel("typography")}
          />
        </Tooltip>

        <Tooltip content="Spacing" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<Grid3X3 size={16} />}
            aria-label="Spacing"
            active={activePanel === "spacing"}
            onClick={() => onTogglePanel("spacing")}
          />
        </Tooltip>

        {/* States combobox — replaces Layout button */}
        <div className="w-[90px]">
          <Combobox.Root
            value={forcedState}
            onValueChange={(v) => v && onSetForcedState(v as ForcedState)}
          >
            <Combobox.Input placeholder="State" className="!h-7 !text-xs !px-2" />
            <Combobox.Portal>
              <Combobox.Popup>
                {STATES.map((state) => (
                  <Combobox.Item key={state} value={state}>
                    {state[0].toUpperCase() + state.slice(1)}
                  </Combobox.Item>
                ))}
              </Combobox.Popup>
            </Combobox.Portal>
          </Combobox.Root>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-edge-muted mx-0.5" />

        {/* Search button */}
        <Tooltip content="Search (⌘K)" position="top">
          <IconButton
            variant="ghost"
            size="md"
            icon={<Search size={16} />}
            aria-label="Search components"
            active={searchOpen}
            onClick={() => {
              setSearchOpen((o) => !o);
              if (searchOpen) setSearch("");
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
}
