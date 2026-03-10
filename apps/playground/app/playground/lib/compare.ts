import type { ComponentType } from "react";
import type { ComparisonPair } from "../types";
import { registry } from "../registry";

/**
 * Build a comparison pair for a registered component.
 * Baseline = current workspace component; candidate = resolved iteration component or null.
 */
export function buildComparisonPair(
  componentId: string,
  overrides?: {
    props?: Record<string, unknown>;
    candidateLabel?: string;
    CandidateComponent?: ComponentType<Record<string, unknown>> | null;
  },
): ComparisonPair | null {
  const entry = registry.find((e) => e.id === componentId);
  if (!entry) return null;

  return {
    componentId,
    props: { ...entry.defaultProps, ...overrides?.props },
    baselineLabel: `${entry.label} (baseline)`,
    candidateLabel: overrides?.candidateLabel ?? `${entry.label} (candidate)`,
    CandidateComponent: overrides?.CandidateComponent ?? null,
  };
}

/**
 * Stable comparison props for registered components.
 * These are chosen to make visual differences obvious during review.
 * Components not listed here use their registry defaultProps.
 */
export const SEED_COMPARISON_PROPS: Record<string, Record<string, unknown>> = {
  button: {
    children: "Submit Order",
    variant: "primary",
    size: "md",
  },
  card: {},
  input: {},
  badge: {
    children: "Active",
    variant: "success",
  },
  alert: {},
  progress: {
    value: 65,
  },
  checkbox: {},
  switch: {},
  slider: {},
  accordion: {},
  tooltip: {},
  breadcrumbs: {},
  divider: {
    variant: "solid",
  },
};
