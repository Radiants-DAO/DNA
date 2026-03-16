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
  /** When set, only show icons whose name is in this list */
  filterNames?: string[];
}

export function IconFinder({ onClose, filterNames }: IconFinderProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseSet = useMemo(() => {
    if (!filterNames) return allIcons;
    const allowed = new Set(filterNames);
    return allIcons.filter((icon) => allowed.has(icon.name));
  }, [filterNames]);

  const filtered = useMemo(() => {
    if (!search.trim()) return baseSet;
    const q = search.toLowerCase();
    return baseSet.filter((icon) => icon.name.toLowerCase().includes(q));
  }, [search, baseSet]);

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
      <div className={`${filterNames ? "w-96" : "w-72"} rounded-sm border border-line bg-page/95 backdrop-blur-sm shadow-lg`}>
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
            placeholder="Search icons…"
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
        <div className={`${filterNames ? "max-h-96" : "max-h-64"} overflow-y-auto p-2`}>
          {filtered.length === 0 ? (
            <div className="py-4 text-center font-mono text-xs text-sub">
              No match
            </div>
          ) : (
            <div className={`grid ${filterNames ? "grid-cols-5" : "grid-cols-6"} gap-0.5`}>
              {filtered.map(({ name, Component }) => (
                <button
                  key={name}
                  onClick={() => handleCopy(name)}
                  className="group flex flex-col items-center gap-0.5 rounded-sm p-2 hover:bg-inv transition-colors"
                  title={`import { ${name} } from "@rdna/radiants/icons"`}
                >
                  <Component size={20} className="text-main" />
                  <span className="font-mono text-xs text-sub truncate w-full text-center leading-tight">
                    {copied === name ? "✓" : name}
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
              : "Click to copy name · @rdna/radiants/icons"}
          </span>
        </div>
      </div>
    </div>
  );
}
