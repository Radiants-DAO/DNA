/**
 * Load and map RDNA violations from the generated manifest
 * onto playground registry entries.
 */

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

let cachedManifest: ViolationsManifest | null = null;

/**
 * Load the violations manifest. Caches after first load.
 * Returns empty object if manifest is unavailable.
 */
export function loadViolationsManifest(): ViolationsManifest {
  if (cachedManifest !== null) return cachedManifest;

  try {
    // Dynamic import of the generated JSON — bundled at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require("../../../generated/violations.manifest.json");
    cachedManifest = data as ViolationsManifest;
    return cachedManifest;
  } catch {
    cachedManifest = {};
    return cachedManifest;
  }
}

/** Reset the cache (useful after regenerating the manifest) */
export function resetViolationsCache(): void {
  cachedManifest = null;
}

/**
 * Get violations for a specific component by its source path.
 * Returns null if no violations found.
 */
export function getViolationsForComponent(
  sourcePath: string,
): ComponentViolations | null {
  const manifest = loadViolationsManifest();
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
