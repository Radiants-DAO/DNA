"use client";

import { Suspense, useState } from "react";
import { registry } from "./registry";
import { ViewportPresetBar, PRESETS } from "./components/ViewportPresetBar";
import { ViolationBadge } from "./components/ViolationBadge";
import {
  getViolationsForComponent,
  getViolationsForIteration,
} from "./lib/violations";
import type { ComparisonPair } from "./types";

type ViewportPreset = (typeof PRESETS)[number];

interface ComparisonViewProps {
  pair: ComparisonPair;
  colorMode: "light" | "dark";
}

export function ComparisonView({ pair, colorMode }: ComparisonViewProps) {
  const entry = registry.find((e) => e.id === pair.componentId);
  const [preset, setPreset] = useState<ViewportPreset>(PRESETS[1]); // desktop default

  if (!entry) {
    return (
      <div className="flex flex-1 items-center justify-center text-status-error">
        Component not found: {pair.componentId}
      </div>
    );
  }

  const BaselineComponent = entry.Component;
  const CandidateComponent = pair.CandidateComponent;
  const modeClass = colorMode === "dark" ? "dark" : "light";

  if (!BaselineComponent) {
    return (
      <div className="flex flex-1 items-center justify-center text-content-muted">
        {entry.label} has no renderable demo for comparison.
      </div>
    );
  }

  const paneStyle = {
    width: preset.width,
    height: preset.height,
  };

  const baselineViolations = getViolationsForComponent(entry.sourcePath);
  const candidateViolations = pair.candidateFileName
    ? getViolationsForIteration(pair.candidateFileName)
    : null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header with viewport presets */}
      <div className="flex items-center justify-between border-b border-edge-primary bg-surface-primary px-4 py-3">
        <span className="font-heading text-sm uppercase tracking-tight">
          Comparing: {entry.label}
        </span>
        <ViewportPresetBar
          activePreset={preset.id}
          onSelect={(id) => {
            const found = PRESETS.find((p) => p.id === id);
            if (found) setPreset(found);
          }}
        />
      </div>

      {/* Side-by-side panes */}
      <div className="flex flex-1 items-start justify-center gap-8 overflow-auto bg-surface-secondary p-8">
        {/* Baseline */}
        <div className="flex flex-col overflow-hidden rounded-md border border-edge-primary bg-surface-primary shadow-resting">
          <div className="flex items-center justify-between border-b border-edge-primary px-3 py-2">
            <span className="font-heading text-xs uppercase tracking-tight text-content-muted">
              {pair.baselineLabel}
            </span>
            {baselineViolations && (
              <ViolationBadge violations={baselineViolations} compact />
            )}
          </div>
          <div
            className={`flex items-center justify-center overflow-auto p-6 ${modeClass}`}
            style={paneStyle}
          >
            <Suspense fallback={<div className="text-sm text-content-muted">Loading…</div>}>
              <BaselineComponent {...pair.props} />
            </Suspense>
          </div>
        </div>

        {/* Candidate */}
        <div className="flex flex-col overflow-hidden rounded-md border border-edge-primary bg-surface-primary shadow-resting">
          <div className="flex items-center justify-between border-b border-edge-primary px-3 py-2">
            <span className="font-heading text-xs uppercase tracking-tight text-content-muted">
              {pair.candidateLabel}
            </span>
            {candidateViolations && (
              <ViolationBadge violations={candidateViolations} compact />
            )}
          </div>
          <div
            className={`flex items-center justify-center overflow-auto p-6 ${modeClass}`}
            style={paneStyle}
          >
            {CandidateComponent ? (
              <Suspense fallback={<div className="text-sm text-content-muted">Loading…</div>}>
                <CandidateComponent {...pair.props} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-sm font-medium text-content-muted">
                  No candidate selected
                </span>
                <span className="max-w-[16rem] text-xs text-content-muted">
                  Generate an iteration first, then select it as the candidate to compare against the baseline.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
