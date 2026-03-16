"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "@rdna/radiants/icons";
import { Input } from "@rdna/radiants/components/core";

/** All SVG icon names available in @rdna/radiants/assets/icons */
const ASSET_ICON_NAMES: string[] = [
  "bar-chart",
  "battery-full",
  "battery-low",
  "block-equalizer",
  "bomb",
  "boombox",
  "broadcast-dish",
  "broken-battery",
  "calendar",
  "calendar2",
  "camera",
  "cd",
  "cd-horizontal",
  "cell-bars",
  "checkmark",
  "chevron-down",
  "clock",
  "close",
  "close-filled",
  "code-file",
  "code-folder",
  "code-window",
  "code-window-filled",
  "coins",
  "comments-blank",
  "comments-typing",
  "computer",
  "copied-to-clipboard",
  "copy",
  "copy-to-clipboard",
  "crosshair-3",
  "crosshair1",
  "crosshair2",
  "crosshair2-retro",
  "crosshair4",
  "cursor-text",
  "cursor2",
  "cursors1",
  "cut",
  "discord",
  "document",
  "document-image",
  "document2",
  "download",
  "eject",
  "electric",
  "envelope-closed",
  "envelope-open",
  "equalizer",
  "eye",
  "eye-hidden",
  "film-camera",
  "film-strip",
  "film-strip-outline",
  "fire",
  "folder-closed",
  "folder-open",
  "full-screen",
  "game-controller",
  "globe",
  "go-forward",
  "grid-3x3",
  "grip-horizontal",
  "grip-vertical",
  "hamburger",
  "hand-point",
  "hard-drive",
  "headphones",
  "heart",
  "home",
  "home2",
  "hourglass",
  "info",
  "info-filled",
  "joystick",
  "lightbulb",
  "lightbulb2",
  "line-chart",
  "list",
  "lock-closed",
  "lock-open",
  "microphone",
  "microphone-mute",
  "minus",
  "money",
  "moon",
  "more-horizontal",
  "more-vertical",
  "multiple-images",
  "music-8th-notes",
  "outline-box",
  "paper-plane",
  "pause",
  "pencil",
  "picture-in-picture",
  "pie-chart",
  "play",
  "plug",
  "plus",
  "power1",
  "power2",
  "print",
  "question",
  "question-filled",
  "rad-mark",
  "radiants-logo",
  "record-playback",
  "record-player",
  "refresh-filled",
  "refresh1",
  "reload",
  "save",
  "save-2",
  "search",
  "seek-back",
  "seek-forward",
  "settings-cog",
  "share",
  "skip-back",
  "skip-forward",
  "skull-and-crossbones",
  "sort-descending",
  "sort-filter-empty",
  "sort-filter-filled",
  "sparkles",
  "stop-playback",
  "swap",
  "tape",
  "telephone",
  "trash",
  "trash-full",
  "trash-open",
  "trophy",
  "trophy2",
  "tv",
  "twitter",
  "underline",
  "upload",
  "usb",
  "usb-icon",
  "USDC",
  "usericon",
  "volume-faders",
  "volume-high",
  "volume-mute",
  "warning-filled",
  "warning-filled-outline",
  "warning-hollow",
  "wifi",
  "window-error",
  "windows",
  "wrench",
  "zip-file",
  "zip-file2",
];

interface IconFinderProps {
  onClose: () => void;
}

export function IconFinder({ onClose }: IconFinderProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return ASSET_ICON_NAMES;
    const q = search.toLowerCase();
    return ASSET_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="dark" onClick={(e) => e.stopPropagation()}>
      <div className="w-96 rounded-sm border border-line bg-page/95 backdrop-blur-sm shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-widest text-sub">
            Icons ({filtered.length})
          </span>
          <button
            onClick={onClose}
            className="font-mono text-xs text-sub hover:text-main"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-rule">
          <Input
            ref={inputRef}
            placeholder="Search icons..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            size="sm"
            className="w-full bg-page/80 backdrop-blur-sm border-line rounded-sm text-main placeholder:text-sub"
            autoFocus
          />
        </div>

        {/* Grid */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-4 text-center font-mono text-xs text-sub">
              No match
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-0.5">
              {filtered.map((name) => (
                <button
                  key={name}
                  onClick={() => handleCopy(name)}
                  className="group flex flex-col items-center gap-0.5 rounded-sm p-2 hover:bg-inv transition-colors"
                  title={`<Icon name="${name}" />`}
                >
                  <Icon name={name} size={20} className="text-main" />
                  <span className="font-mono text-xs text-sub truncate w-full text-center leading-tight">
                    {copied === name ? "copied" : name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-rule px-3 py-1.5">
          <span className="font-mono text-xs text-sub">
            {copied
              ? `Copied: ${copied}`
              : 'Click to copy name \u00b7 <Icon name="..." />'}
          </span>
        </div>
      </div>
    </div>
  );
}
