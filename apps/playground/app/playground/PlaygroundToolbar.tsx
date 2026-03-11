"use client";

import { useState, useCallback } from "react";
import { Input } from "@rdna/radiants/components/core/Input/Input";
import { Switch } from "@rdna/radiants/components/core/Switch/Switch";
import { Button } from "@rdna/radiants/components/core/Button/Button";
import { registry } from "./registry";
import { isRenderable, type ForcedState } from "./types";

const STATES: ForcedState[] = ["default", "hover", "active", "focus", "disabled"];

interface PlaygroundToolbarProps {
  selectedPackage: string;
  packages: string[];
  onSelectPackage: (pkg: string) => void;
  onFocusNode: (registryId: string) => void;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
  forcedState: ForcedState;
  onSetForcedState: (state: ForcedState) => void;
}

/** Short display name for a package scope */
function packageLabel(pkg: string) {
  return pkg.replace(/^@rdna\//, "").replace(/^\w/, (c) => c.toUpperCase());
}

export function PlaygroundToolbar({
  selectedPackage,
  packages,
  onSelectPackage,
  onFocusNode,
  colorMode,
  onToggleColorMode,
  forcedState,
  onSetForcedState,
}: PlaygroundToolbarProps) {
  const [search, setSearch] = useState("");

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" || !search.trim()) return;
      const match = registry.find(
        (entry) =>
          entry.packageName === selectedPackage &&
          isRenderable(entry) &&
          entry.label.toLowerCase().includes(search.toLowerCase()),
      );
      if (match) {
        onFocusNode(match.id);
        setSearch("");
      }
    },
    [search, selectedPackage, onFocusNode],
  );

  return (
    <div className="flex items-center gap-3 border-b border-edge-primary bg-surface-primary px-4 py-2">
      {/* Package selector */}
      <div className="flex items-center gap-1">
        {packages.map((pkg) => (
          <Button
            key={pkg}
            variant={pkg === selectedPackage ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelectPackage(pkg)}
          >
            {packageLabel(pkg)}
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-edge-primary" />

      {/* Search */}
      <Input
        placeholder="Search components…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        size="sm"
        className="w-48"
      />

      {/* Divider */}
      <div className="h-5 w-px bg-edge-primary" />

      {/* State selector */}
      <div className="flex items-center gap-1">
        <span className="font-heading text-xs uppercase tracking-tight text-content-muted mr-1">
          State
        </span>
        {STATES.map((state) => (
          <Button
            key={state}
            variant={forcedState === state ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSetForcedState(state)}
          >
            {state[0].toUpperCase() + state.slice(1)}
          </Button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Moon toggle */}
      <div className="flex items-center gap-1.5">
        <span className="font-heading text-xs uppercase tracking-tight text-content-muted">
          Moon
        </span>
        <Switch
          checked={colorMode === "dark"}
          onChange={onToggleColorMode}
          size="sm"
        />
      </div>
    </div>
  );
}
