import { readFullComponent } from "../lib/manifest.mjs";
const BASE_URL = process.env.PLAYGROUND_URL || "http://localhost:3004";

export async function run(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error(
      "Usage: rdna-playground set-props <component> key=value [key=value...] [--color-mode light|dark] [--state hover]",
    );
    process.exit(1);
  }

  const component = readFullComponent(componentId);
  if (!component) {
    console.error(`Unknown component: ${componentId}`);
    process.exit(1);
  }
  const knownProps = component.props ?? {};

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
