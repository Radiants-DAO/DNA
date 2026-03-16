"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as Icons from "@rdna/radiants/icons";
import type { IconProps } from "@rdna/radiants/icons";
import { Input } from "@rdna/radiants/components/core";
import type { ComponentType } from "react";

interface IconEntry {
  name: string;
  Component: ComponentType<IconProps>;
}

/** Build static icon list from all named exports (exclude dynamic loader + non-components) */
const allIcons: IconEntry[] = Object.entries(Icons)
  .filter(
    ([name, val]) =>
      typeof val === "function" &&
      name !== "Icon" &&
      /^[A-Z]/.test(name),
  )
  .map(([name, Component]) => ({
    name,
    Component: Component as ComponentType<IconProps>,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface IconFinderProps {
  onClose: () => void;
}

export function IconFinder({ onClose }: IconFinderProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return allIcons;
    const q = search.toLowerCase();
    return allIcons.filter((icon) => icon.name.toLowerCase().includes(q));
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
      <div className="w-72 rounded-sm border border-edge-primary bg-surface-primary/95 backdrop-blur-sm shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge-muted px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-widest text-content-secondary">
            Icons ({filtered.length})
          </span>
          <button
            onClick={onClose}
            className="font-mono text-xs text-content-secondary hover:text-content-primary"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-edge-muted">
          <Input
            ref={inputRef}
            placeholder="Search icons…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            size="sm"
            className="w-full bg-surface-primary/80 backdrop-blur-sm border-edge-primary rounded-sm text-content-primary placeholder:text-content-secondary"
            autoFocus
          />
        </div>

        {/* Grid */}
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-4 text-center font-mono text-xs text-content-secondary">
              No match
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-0.5">
              {filtered.map(({ name, Component }) => (
                <button
                  key={name}
                  onClick={() => handleCopy(name)}
                  className="group flex flex-col items-center gap-0.5 rounded-sm p-1.5 hover:bg-surface-secondary transition-colors"
                  title={`import { ${name} } from "@rdna/radiants/icons"`}
                >
                  <Component size={16} className="text-content-primary" />
                  {copied === name && (
                    <span className="font-mono text-xs text-content-accent">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-edge-muted px-3 py-1.5">
          <span className="font-mono text-xs text-content-secondary">
            {copied
              ? `Copied: ${copied}`
              : "Click to copy name · @rdna/radiants/icons"}
          </span>
        </div>
      </div>
    </div>
  );
}
