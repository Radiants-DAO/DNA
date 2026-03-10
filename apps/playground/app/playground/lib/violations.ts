/**
 * Load and map RDNA violations from the generated manifest
 * onto playground registry entries.
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

/**
 * Get violations for a specific component by its source path.
 * Returns null if no violations found.
 */
export function getViolationsForComponent(
  sourcePath: string,
): ComponentViolations | null {
  const violations = manifest[sourcePath];

  if (!violations || violations.length === 0) return null;

  return {
    filePath: sourcePath,
    violations,
    errorCount: violations.filter((v) => v.severity === "error").length,
    warnCount: violations.filter((v) => v.severity === "warn").length,
  };
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
