"use client";

import { useState, useCallback } from "react";
import { registry } from "./registry";
import { buildComparisonPair, SEED_COMPARISON_PROPS } from "./lib/compare";
import { fetchIterationsForComponent, loadIterationComponent } from "./lib/iterations";
import { ReviewChecklist } from "./components/ReviewChecklist";
import { getViolationsForComponent } from "./lib/violations";
import { ViolationBadge } from "./components/ViolationBadge";
import { isRenderable } from "./types";
import type { ComparisonPair } from "./types";
import type { ViewMode } from "./PlaygroundClient";

interface PlaygroundSidebarProps {
  onAddComponent: (registryId: string) => void;
  onCompare: (pair: ComparisonPair) => void;
  viewMode: ViewMode;
  onBackToCanvas: () => void;
  colorMode: "light" | "dark";
  onToggleColorMode: () => void;
}

export function PlaygroundSidebar({
  onAddComponent,
  onCompare,
  viewMode,
  onBackToCanvas,
  colorMode,
  onToggleColorMode,
}: PlaygroundSidebarProps) {
  const [filter, setFilter] = useState("");

  // Two-level grouping: package → category
  const packageGroups = registry.reduce<
    Record<string, Record<string, typeof registry>>
  >((acc, entry) => {
    const pkg = entry.packageName;
    if (!acc[pkg]) acc[pkg] = {};
    const g = entry.group;
    if (!acc[pkg][g]) acc[pkg][g] = [];
    acc[pkg][g].push(entry);
    return acc;
  }, {});

  const packageCount = Object.keys(packageGroups).length;

  /** Short display name for a package scope */
  const packageLabel = (pkg: string) =>
    pkg.replace(/^@rdna\//, "").replace(/^\w/, (c) => c.toUpperCase());

  const matchesFilter = useCallback(
    (label: string) => label.toLowerCase().includes(filter.toLowerCase()),
    [filter],
  );

  const onDragStart = useCallback(
    (e: React.DragEvent, registryId: string) => {
      e.dataTransfer.setData("application/x-playground-component", registryId);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleCompare = useCallback(
    async (registryId: string) => {
      const stableProps = SEED_COMPARISON_PROPS[registryId];

      // Try to load the latest iteration for this component as candidate
      const iterations = await fetchIterationsForComponent(registryId);
      let CandidateComponent = null;
      let candidateLabel: string | undefined;

      if (iterations.length > 0) {
        const latest = iterations[iterations.length - 1];
        CandidateComponent = await loadIterationComponent(latest.fileName);
        if (CandidateComponent) {
          candidateLabel = `${latest.fileName}`;
        }
      }

      const candidateFileName =
        iterations.length > 0 ? iterations[iterations.length - 1].fileName : undefined;

      const pair = buildComparisonPair(registryId, {
        props: stableProps,
        CandidateComponent,
        candidateLabel,
        candidateFileName,
      });
      if (pair) onCompare(pair);
    },
    [onCompare],
  );

  return (
    <aside className="flex w-56 flex-col border-r border-edge-primary bg-surface-primary">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-edge-primary px-3 py-2">
        <span className="font-heading text-xs uppercase tracking-tight text-content-muted">
          Components
        </span>
        <div className="flex items-center gap-1">
          {/* Sun/Moon toggle */}
          <button
            onClick={onToggleColorMode}
            className="rounded-sm p-1 text-xs text-content-secondary transition-colors hover:bg-surface-secondary"
            title={colorMode === "light" ? "Switch to Moon mode" : "Switch to Sun mode"}
          >
            {colorMode === "light" ? "Sun" : "Moon"}
          </button>
          {/* Canvas/Compare toggle */}
          {viewMode === "compare" && (
            <button
              onClick={onBackToCanvas}
              className="rounded-sm p-1 text-xs text-content-secondary transition-colors hover:bg-surface-secondary"
            >
              Canvas
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-edge-primary p-3">
        <input
          type="text"
          placeholder="Filter components…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-sm border border-edge-primary bg-surface-primary px-2 py-1 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus"
        />
      </div>

      {/* Component groups — grouped by package then category */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(packageGroups).map(([pkg, categories]) => {
          // Check if this package has any visible entries at all
          const hasVisible = Object.values(categories).some((entries) =>
            entries.some((e) => matchesFilter(e.label)),
          );
          if (!hasVisible) return null;

          return (
            <div key={pkg}>
              {/* Package heading — only show when multiple packages exist */}
              {packageCount > 1 && (
                <h2 className="mb-2 mt-2 border-b border-edge-primary pb-1 font-heading text-xs font-semibold uppercase tracking-tight text-content-primary first:mt-0">
                  {packageLabel(pkg)}
                </h2>
              )}

              {Object.entries(categories).map(([group, entries]) => {
                const visible = entries.filter((e) => matchesFilter(e.label));
                if (visible.length === 0) return null;

                return (
                  <div key={`${pkg}-${group}`} className="mb-4">
                    <h3 className="mb-1.5 font-heading text-xs uppercase tracking-tight text-content-muted">
                      {group}
                    </h3>
                    <ul className="space-y-1">
                      {visible.map((entry) => {
                        const violations = getViolationsForComponent(
                          entry.sourcePath,
                        );
                        const renderable = isRenderable(entry);
                        return (
                          <li
                            key={entry.id}
                            className={`flex items-center gap-1 rounded-sm border border-edge-primary text-sm transition-colors ${
                              renderable
                                ? "text-content-primary hover:bg-surface-secondary"
                                : "text-content-muted"
                            }`}
                          >
                            {renderable ? (
                              <button
                                draggable
                                onDragStart={(e) => onDragStart(e, entry.id)}
                                onClick={() => onAddComponent(entry.id)}
                                className="flex-1 cursor-grab px-2 py-1.5 text-left active:cursor-grabbing"
                              >
                                {entry.label}
                              </button>
                            ) : (
                              <span
                                className="flex-1 px-2 py-1.5"
                                title="Metadata only — no renderable demo"
                              >
                                {entry.label}
                              </span>
                            )}
                            {violations && (
                              <ViolationBadge violations={violations} compact />
                            )}
                            {renderable && (
                              <button
                                onClick={() => handleCompare(entry.id)}
                                className="px-1.5 py-1.5 text-content-muted transition-colors hover:text-content-primary"
                                title="Compare baseline vs candidate"
                              >
                                vs
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Review checklist (visible in compare mode) */}
      {viewMode === "compare" && <ReviewChecklist />}
    </aside>
  );
}
