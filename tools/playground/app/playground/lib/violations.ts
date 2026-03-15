/**
 * Load and map RDNA violations from the generated manifest
 * onto playground registry entries and iteration files.
 */

import manifestData from "../../../generated/violations.manifest.json";

export interface Violation {
  ruleId: string;
  severity: "error" | "warn";
  message: string;
  line: number;
  column: number;
}

export interface ComponentViolations {
  filePath: string;
  violations: Violation[];
  errorCount: number;
  warnCount: number;
}

type ViolationsManifest = Record<string, Violation[]>;

const manifest: ViolationsManifest = manifestData as ViolationsManifest;

function toResult(
  filePath: string,
  violations: Violation[],
): ComponentViolations | null {
  if (violations.length === 0) return null;
  return {
    filePath,
    violations,
    errorCount: violations.filter((v) => v.severity === "error").length,
    warnCount: violations.filter((v) => v.severity === "warn").length,
  };
}

/**
 * Get violations for a specific file path (component source or iteration).
 * Returns null if no violations found.
 */
export function getViolationsForComponent(
  sourcePath: string,
): ComponentViolations | null {
  const violations = manifest[sourcePath];
  if (!violations || violations.length === 0) return null;
  return toResult(sourcePath, violations);
}

/**
 * Get violations for an iteration file by its filename.
 * Iteration files are keyed in the manifest by their relative path
 * from the monorepo root (e.g. "apps/playground/app/playground/iterations/button.iteration-1.tsx").
 */
export function getViolationsForIteration(
  fileName: string,
): ComponentViolations | null {
  const iterPath = `tools/playground/app/playground/iterations/${fileName}`;
  const violations = manifest[iterPath];
  if (!violations || violations.length === 0) return null;
  return toResult(iterPath, violations);
}

/**
 * Get the worst severity for a component: "error" > "warn" > null (clean).
 */
export function getComponentStatus(
  sourcePath: string,
): "error" | "warn" | null {
  const data = getViolationsForComponent(sourcePath);
  if (!data) return null;
  if (data.errorCount > 0) return "error";
  if (data.warnCount > 0) return "warn";
  return null;
}
