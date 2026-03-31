"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { GENERATED_ICON_NAMES, ICON_BY_NAME } from "@rdna/radiants/icons";
import { Input } from "@rdna/radiants/components/core";

interface IconFinderProps {
  onClose: () => void;
}

export function IconFinder({ onClose }: IconFinderProps) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return [...GENERATED_ICON_NAMES];
    const q = search.toLowerCase();
    return GENERATED_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
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
              {filtered.map((name) => {
                const IconComp = ICON_BY_NAME[name];
                return (
                  <button
                    key={name}
                    onClick={() => handleCopy(name)}
                    className="group flex flex-col items-center gap-0.5 rounded-sm p-2 hover:bg-inv transition-colors"
                    title={`<Icon name="${name}" />`}
                  >
                    {IconComp ? (
                      <IconComp size={24} className="text-main" />
                    ) : (
                      <span className="text-sub text-xs">?</span>
                    )}
                    <span className="font-mono text-xs text-sub truncate w-full text-center leading-tight">
                      {copied === name ? "copied" : name}
                    </span>
                  </button>
                );
              })}
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
