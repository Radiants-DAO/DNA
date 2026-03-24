import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");
const BASE_URL = process.env.PLAYGROUND_URL || "http://localhost:3004";

function readComponentProps(componentId) {
  const raw = readFileSync(
    resolve(PLAYGROUND_ROOT, "generated/registry.manifest.json"),
    "utf-8",
  );
  const manifest = JSON.parse(raw);
  for (const pkg of Object.values(manifest)) {
    for (const c of pkg.components) {
      if (c.name.toLowerCase() === componentId.toLowerCase()) {
        return c.props ?? {};
      }
    }
  }
  return null;
}

export async function run(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error(
      "Usage: rdna-playground set-props <component> key=value [key=value...] [--color-mode light|dark] [--state hover]",
    );
    process.exit(1);
  }

  const knownProps = readComponentProps(componentId);
  if (knownProps === null) {
    console.error(`Unknown component: ${componentId}`);
    process.exit(1);
  }

  // Parse flags and key=value pairs
  const params = new URLSearchParams();
  let i = 1;
  while (i < args.length) {
    if (args[i] === "--color-mode" && args[i + 1]) {
      params.set("colorMode", args[i + 1]);
      i += 2;
      continue;
    }
    if (args[i] === "--state" && args[i + 1]) {
      params.set("state", args[i + 1]);
      i += 2;
      continue;
    }

    const pair = args[i];
    const eqIndex = pair.indexOf("=");
    if (eqIndex > 0) {
      const key = pair.slice(0, eqIndex);
      const value = pair.slice(eqIndex + 1);

      // Warn on unknown props (but still include them)
      if (!(key in knownProps)) {
        console.warn(`Warning: "${key}" not in manifest props for ${componentId}`);
      }

      params.set(key, value);
    }
    i++;
  }

  const url = `${BASE_URL}/playground/preview/${componentId.toLowerCase()}?${params.toString()}`;
  console.log(url);
}
