import type { ComponentType } from "react";
import type { IterationFile } from "../types";

/** Parse iteration number from filename like `button.iteration-3.tsx` → 3 */
function parseIterationNumber(fileName: string): number {
  const m = /\.iteration-(\d+)\.tsx$/.exec(fileName);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Fetch available iteration files for a specific component.
 * Uses the server's `byComponent` map (exact componentId match, pre-sorted).
 */
export async function fetchIterationsForComponent(
  componentId: string,
): Promise<IterationFile[]> {
  try {
    const res = await fetch("/playground/api/generate");
    if (!res.ok) return [];
    const data = await res.json();

    // Use the byComponent map for exact matching (no prefix collisions)
    const byComponent: Record<string, string[]> = data.byComponent ?? {};
    const files = byComponent[componentId.toLowerCase()] ?? [];

    return files
      .slice() // don't mutate the original
      .sort((a, b) => parseIterationNumber(a) - parseIterationNumber(b))
      .map((fileName) => ({ fileName, componentId }));
  } catch {
    return [];
  }
}

/**
 * Dynamically import an iteration component from the iterations directory.
 *
 * Uses a webpack/turbopack dynamic import context scoped to ./iterations/.
 * The fileName must match a .tsx file in that directory.
 */
export async function loadIterationComponent(
  fileName: string,
): Promise<ComponentType<Record<string, unknown>> | null> {
  try {
    // Strip .tsx extension for the import — dynamic import context resolves it
    const moduleName = fileName.replace(/\.tsx$/, "");
    const mod = await import(`../iterations/${moduleName}`);

    // Prefer default export, then look for a named export that is a function
    // (generated iterations use `export function Button` — named, not default)
    if (mod.default) return mod.default as ComponentType<Record<string, unknown>>;
    for (const key of Object.keys(mod)) {
      if (typeof mod[key] === "function") {
        return mod[key] as ComponentType<Record<string, unknown>>;
      }
    }
    return null;
  } catch {
    return null;
  }
}
