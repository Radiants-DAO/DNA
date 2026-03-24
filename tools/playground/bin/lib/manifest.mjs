import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");

/**
 * Read the full component entry from the registry manifest.
 * Returns the raw manifest object with all fields (props, states, etc.).
 */
export function readFullComponent(componentId) {
  const raw = readFileSync(
    resolve(PLAYGROUND_ROOT, "generated/registry.manifest.json"),
    "utf-8",
  );
  const manifest = JSON.parse(raw);
  for (const pkg of Object.values(manifest)) {
    for (const c of pkg.components) {
      if (c.name.toLowerCase() === componentId.toLowerCase()) {
        return c;
      }
    }
  }
  return null;
}
