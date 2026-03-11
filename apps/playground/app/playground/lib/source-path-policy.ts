/**
 * Source-path allowlists for the playground's write operations.
 *
 * Generation writes iteration files to a fixed directory.
 * Adoption replaces component source files in allowed package/app roots.
 * This module enforces that neither operation can write outside intended boundaries.
 */

/** Package roots where adoption is allowed (relative to monorepo root) */
const ALLOWED_PACKAGE_ROOTS = [
  "packages/radiants/components/core/",
  "packages/monolith/components/core/",
];

/** App roots where adoption is allowed (relative to monorepo root) */
const ALLOWED_APP_ROOTS = [
  "apps/rad-os/components/",
  "apps/radiator/src/components/",
];

/** The iteration output directory (relative to monorepo root) */
const ITERATIONS_ROOT = "apps/playground/app/playground/iterations/";

/**
 * Check whether a source path is an allowed adoption target.
 * Path must be relative to the monorepo root.
 *
 * Rejects paths containing ".." segments to prevent traversal escapes.
 */
export function isAllowedAdoptionTarget(sourcePath: string): boolean {
  const normalized = sourcePath.replace(/\\/g, "/");

  // Reject any path with traversal segments — even if it starts with an allowed root,
  // ".." could resolve outside it (e.g. "packages/radiants/components/core/../../package.json").
  if (normalized.split("/").includes("..")) {
    return false;
  }

  return [...ALLOWED_PACKAGE_ROOTS, ...ALLOWED_APP_ROOTS].some((root) =>
    normalized.startsWith(root),
  );
}

/**
 * Check whether a path is inside the iterations output directory.
 * Path must be relative to the monorepo root.
 */
export function isIterationPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith(ITERATIONS_ROOT);
}

/**
 * Validate that an adoption target is both in the registry and in the allowlist.
 * Returns an error string if invalid, null if OK.
 */
export function validateAdoptionTarget(
  sourcePath: string,
  registrySourcePaths: Set<string>,
): string | null {
  if (!registrySourcePaths.has(sourcePath)) {
    return `Component source path not found in registry: ${sourcePath}`;
  }
  if (!isAllowedAdoptionTarget(sourcePath)) {
    return `Adoption not allowed for path outside permitted roots: ${sourcePath}`;
  }
  return null;
}
