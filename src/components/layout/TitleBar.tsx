import { useState } from "react";
import { useAppStore } from "../../stores/appStore";

/**
 * TitleBar component - Custom title bar for frameless window
 * Provides drag region and mode toggle controls
 * Traffic lights are handled by macOS with titleBarStyle: "Overlay"
 */
export function TitleBar() {
  const editorMode = useAppStore((s) => s.editorMode);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-surface/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between select-none"
    >
      {/* Left section - Traffic light spacer + Search */}
      <div className="flex items-center gap-3 pl-20">
        <div className="relative">
          <input
            type="text"
            placeholder="Search (Cmd+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-7 bg-background/50 border border-white/8 rounded-md px-3 text-xs text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Center - Breakpoint selector */}
      <div className="flex items-center gap-2">
        <BreakpointSelector />
      </div>

      {/* Right section - Mode toggle */}
      <div className="flex items-center gap-3 pr-4">
        <ModeToggle
          mode={editorMode === "clipboard" ? "clipboard" : "direct-edit"}
          onToggle={(mode) =>
            setEditorMode(mode === "clipboard" ? "clipboard" : "direct-edit")
          }
        />
      </div>
    </div>
  );
}

function BreakpointSelector() {
  const [breakpoint, setBreakpoint] = useState<string>("desktop");

  const breakpoints = [
    { id: "mobile", label: "Mobile", width: "375px" },
    { id: "tablet", label: "Tablet", width: "768px" },
    { id: "desktop", label: "Desktop", width: "1440px" },
  ];

  return (
    <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5">
      {breakpoints.map((bp) => (
        <button
          key={bp.id}
          onClick={() => setBreakpoint(bp.id)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            breakpoint === bp.id
              ? "bg-surface text-text"
              : "text-text-muted hover:text-text"
          }`}
          title={bp.width}
        >
          {bp.label}
        </button>
      ))}
    </div>
  );
}

interface ModeToggleProps {
  mode: "clipboard" | "direct-edit";
  onToggle: (mode: "clipboard" | "direct-edit") => void;
}

function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5">
      <button
        onClick={() => onToggle("clipboard")}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${
          mode === "clipboard"
            ? "bg-surface text-text"
            : "text-text-muted hover:text-text"
        }`}
        title="Copy CSS to clipboard"
      >
        Clipboard
      </button>
      <button
        onClick={() => onToggle("direct-edit")}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${
          mode === "direct-edit"
            ? "bg-surface text-text"
            : "text-text-muted hover:text-text"
        }`}
        title="Write changes directly to files"
      >
        Direct Edit
      </button>
    </div>
  );
}

export default TitleBar;
