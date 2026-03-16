"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@rdna/radiants/components/core";
import { registry } from "../registry";
import { isRenderable } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  registryId: string;
  label: string;
  group: string;
  searchText: string;
}

interface ComponentSearchProps {
  selectedPackage: string;
  onSelect: (registryId: string) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Fuzzy match — every query token must appear somewhere in the target
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, text: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((token) => text.includes(token));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComponentSearch({
  selectedPackage,
  onSelect,
  onClose,
}: ComponentSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Build search index: one entry per component + one per variant
  const searchIndex = useMemo(() => {
    const items: SearchResult[] = [];

    for (const entry of registry) {
      if (entry.packageName !== selectedPackage || !isRenderable(entry)) continue;

      // Component-level result
      items.push({
        registryId: entry.id,
        label: entry.componentName,
        group: entry.group,
        searchText: `${entry.componentName} ${entry.label}`.toLowerCase(),
      });

      // Variant-level results
      if (entry.variants) {
        for (const variant of entry.variants) {
          items.push({
            registryId: entry.id,
            label: `${entry.componentName} · ${variant.label}`,
            group: entry.group,
            searchText:
              `${entry.componentName} ${variant.label} ${entry.label}`.toLowerCase(),
          });
        }
      }
    }

    return items;
  }, [selectedPackage]);

  // Filter + deduplicate
  const results = useMemo(() => {
    if (!search.trim()) return [];
    const matches = searchIndex.filter((r) => fuzzyMatch(search, r.searchText));

    // Deduplicate by registryId + label
    const seen = new Set<string>();
    return matches
      .filter((r) => {
        const key = `${r.registryId}:${r.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [search, searchIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [search]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect(result.registryId);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (results.length ? (i + 1) % results.length : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) =>
          results.length ? (i - 1 + results.length) % results.length : 0,
        );
        return;
      }
      if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIdx] ?? results[0]);
      }
    },
    [results, selectedIdx, handleSelect, onClose],
  );

  return (
    <div className="dark flex flex-col">
      <Input
        placeholder="Find component…"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        size="sm"
        className="w-56 bg-page/80 backdrop-blur-sm border-line rounded-sm text-main placeholder:text-sub focus-visible:ring-0 focus-visible:ring-offset-0"
        autoFocus
      />

      {/* Results dropdown */}
      {search.trim() !== "" && (
        <div className="mt-0.5 w-56 rounded-sm border border-line bg-page/95 backdrop-blur-sm shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-2.5 py-2 text-center font-mono text-xs text-sub">
              No results
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.registryId}:${r.label}`}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left transition-colors ${
                  i === selectedIdx
                    ? "bg-inv"
                    : "hover:bg-inv/50"
                }`}
                onMouseEnter={() => setSelectedIdx(i)}
                onClick={() => handleSelect(r)}
              >
                <span className="font-mono text-sm text-main truncate">
                  {r.label}
                </span>
                <span className="font-mono text-xs text-sub ml-2 shrink-0">
                  {r.group}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
