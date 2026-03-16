"use client";

import { useState, useEffect } from "react";
import { Button, Tooltip, Switch, Toolbar } from "@rdna/radiants/components/core";
import { Grid3X3, Cursors1, CommentsBlank, Search } from "@rdna/radiants/icons";
import { ComponentSearch } from "./components/ComponentSearch";
import { IconFinder } from "./components/IconFinder";

export type EditorMode = "component-id" | "comment";

export type FeedbackType = "comment" | "question";

interface ModeToolbarProps {
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  activeFeedbackType: FeedbackType | null;
  onSetActiveFeedbackType: (type: FeedbackType) => void;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  selectedPackage: string;
  onFocusNode: (registryId: string, variantLabel?: string) => void;
}

export function ModeToolbar({
  editorMode,
  onSetEditorMode,
  activeFeedbackType,
  onSetActiveFeedbackType,
  colorMode,
  onToggleColorMode,
  selectedPackage,
  onFocusNode,
}: ModeToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [iconFinderOpen, setIconFinderOpen] = useState(false);

  // F = search, I = icon finder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setSearchOpen(true);
        setIconFinderOpen(false);
      }
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setIconFinderOpen(true);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Icon finder — appears above toolbar when open */}
      {iconFinderOpen && (
        <IconFinder onClose={() => setIconFinderOpen(false)} />
      )}

      {/* Search — appears above toolbar when open */}
      {searchOpen && (
        <ComponentSearch
          selectedPackage={selectedPackage}
          onSelect={(id, variantLabel) => {
            onFocusNode(id, variantLabel);
            setSearchOpen(false);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* Main toolbar */}
      <Toolbar.Root className="dark" data-playground-id="mode-toolbar">
        {/* Mode buttons */}
        <Tooltip content="Select (V)" position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<Cursors1 size={16} />}
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
            icon={<CommentsBlank size={16} />}
            aria-label="Comment"
            active={editorMode === "comment"}
            onClick={() => { onSetEditorMode("comment"); onSetActiveFeedbackType("comment"); }}
          />
        </Tooltip>

        <Toolbar.Separator />

        {/* Dark mode toggle */}
        <Switch
          checked={colorMode === "dark"}
          onChange={onToggleColorMode}
          size="sm"
        />

        {/* Search button */}
        <Tooltip content="Search (F)" position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<Search size={16} />}
            aria-label="Search components"
            active={searchOpen}
            onClick={() => {
              setSearchOpen((o) => !o);
              setIconFinderOpen(false);
            }}
          />
        </Tooltip>

        {/* Icon finder button */}
        <Tooltip content="Icons (I)" position="top">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            icon={<Grid3X3 size={16} />}
            aria-label="Browse icons"
            active={iconFinderOpen}
            onClick={() => {
              setIconFinderOpen((o) => !o);
              setSearchOpen(false);
            }}
          />
        </Tooltip>
      </Toolbar.Root>
    </div>
  );
}
