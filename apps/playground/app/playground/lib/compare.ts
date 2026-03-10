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
 * Stable comparison props for each seed component.
 * These are chosen to make visual differences obvious during review.
 */
export const SEED_COMPARISON_PROPS: Record<string, Record<string, unknown>> = {
  button: {
    children: "Submit Order",
    variant: "primary",
    size: "md",
  },
  card: {
    variant: "default",
    headerText: "Deployment Status",
    bodyText:
      "Your latest build was deployed successfully to production. All health checks passed and traffic is now being routed to the new version.",
  },
  input: {
    size: "md",
    placeholder: "Search components…",
    labelText: "Search",
  },
};
