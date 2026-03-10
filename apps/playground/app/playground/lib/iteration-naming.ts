/** Expected naming: exactly `componentId.iteration-N.tsx` */
const ITERATION_PATTERN = /^([a-z][a-z0-9]*)\.iteration-(\d+)\.tsx$/i;

/** Parse iteration filename into componentId and number, or null */
export function parseIterationName(
  f: string,
): { componentId: string; n: number } | null {
  const m = ITERATION_PATTERN.exec(f);
  if (!m) return null;
  return { componentId: m[1].toLowerCase(), n: parseInt(m[2], 10) };
}

/** Sort iteration filenames by parsed componentId then iteration number */
export function sortIterationFiles(files: string[]): string[] {
  return files
    .filter((f) => parseIterationName(f) !== null)
    .sort((a, b) => {
      const pa = parseIterationName(a)!;
      const pb = parseIterationName(b)!;
      if (pa.componentId !== pb.componentId)
        return pa.componentId.localeCompare(pb.componentId);
      return pa.n - pb.n;
    });
}

/** Filter iteration files to only those matching a specific componentId */
export function filterByComponent(
  files: string[],
  componentId: string,
): string[] {
  const id = componentId.toLowerCase();
  return sortIterationFiles(
    files.filter((f) => {
      const parsed = parseIterationName(f);
      return parsed !== null && parsed.componentId === id;
    }),
  );
}

/**
 * Validate an iteration filename for the adopt route.
 * Returns { valid: true, componentId } or { valid: false, error }.
 */
export function validateAdoptionFile(
  iterationFile: string,
  targetComponentId: string,
):
  | { valid: true; componentId: string; iterationNumber: number }
  | { valid: false; error: string } {
  // Must be a bare filename (no path separators)
  if (iterationFile.includes("/") || iterationFile.includes("\\")) {
    return { valid: false, error: "iterationFile must be a bare filename, not a path" };
  }

  const parsed = parseIterationName(iterationFile);
  if (!parsed) {
    return {
      valid: false,
      error: "iterationFile does not match expected pattern: ComponentId.iteration-N.tsx",
    };
  }

  // Cross-component guard
  if (parsed.componentId !== targetComponentId.toLowerCase()) {
    return {
      valid: false,
      error: `Component mismatch: iteration file belongs to "${parsed.componentId}" but adoption target is "${targetComponentId}"`,
    };
  }

  return {
    valid: true,
    componentId: parsed.componentId,
    iterationNumber: parsed.n,
  };
}
