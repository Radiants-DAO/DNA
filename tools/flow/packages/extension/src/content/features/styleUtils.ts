/**
 * Normalize style property names from camelCase to kebab-case.
 * e.g., marginTop -> margin-top
 */
export function normalizeStyleChanges(
  changes: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(changes)) {
    const prop = key.includes('-')
      ? key
      : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    normalized[prop] = value;
  }
  return normalized;
}
