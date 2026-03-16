"use client";

import { useState, useCallback } from "react";
import { Button, Tooltip, Combobox, Input } from "@rdna/radiants/components/core";
import {
  MousePointer2,
  MessageCircle,
  Search,
} from "@rdna/radiants/icons";
import { DarkModeIcon } from "@rdna/radiants/icons";
import { registry } from "./registry";
import { isRenderable, type ForcedState } from "./types";

export type EditorMode = "component-id" | "comment";

export type FeedbackType = "comment" | "question";

const STATES: ForcedState[] = ["default", "hover", "active", "focus", "disabled"];

interface ModeToolbarProps {
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  activeFeedbackType: FeedbackType | null;
  onSetActiveFeedbackType: (type: FeedbackType) => void;
  forcedState: ForcedState;
  onSetForcedState: (state: ForcedState) => void;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  selectedPackage: string;
  onFocusNode: (registryId: string) => void;
}

export function ModeToolbar({
  editorMode,
  onSetEditorMode,
  activeFeedbackType,
  onSetActiveFeedbackType,
  forcedState,
  onSetForcedState,
  colorMode,
  onToggleColorMode,
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
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<MousePointer2 size={16} />}
            aria-label="Select"
            active={editorMode === "component-id"}
            onClick={() => onSetEditorMode("component-id")}
          />
        </Tooltip>

        <Tooltip content="Comment (C)" position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<MessageCircle size={16} />}
            aria-label="Comment"
            active={editorMode === "comment"}
            onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("comment"); }}
          />
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-5 bg-edge-muted mx-0.5" />

        {/* States combobox */}
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

        {/* Dark mode toggle */}
        <Tooltip content={colorMode === "dark" ? "Light mode" : "Dark mode"} position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<DarkModeIcon size={16} />}
            aria-label="Toggle color mode"
            active={colorMode === "dark"}
            onClick={onToggleColorMode}
          />
        </Tooltip>

        {/* Search button */}
        <Tooltip content="Search (⌘K)" position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
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
