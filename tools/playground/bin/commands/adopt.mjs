import { post, get } from "../lib/api.mjs";

export async function adopt(args) {
  const iterationFile = args[0];
  if (!iterationFile) {
    throw new Error(
      "Usage: rdna-playground adopt <iteration-file> [--as-variant | --replace <variant-label>]",
    );
  }

  // Parse component ID from filename (e.g. alert.iteration-1.tsx → alert)
  const match = iterationFile.match(/^([a-z][a-z0-9]*)\.iteration-\d+\.tsx$/i);
  if (!match) {
    throw new Error(
      `Invalid iteration filename: ${iterationFile}\nExpected pattern: <componentId>.iteration-<N>.tsx`,
    );
  }
  const componentId = match[1].toLowerCase();

  const replaceLabel = extractFlag(args, "--replace");
  const isNewVariant = args.includes("--as-variant");

  if (!isNewVariant && !replaceLabel) {
    console.log(`Adopt "${iterationFile}" for component "${componentId}":\n`);
    console.log("  --as-variant        Add as a new variant");
    console.log("  --replace <label>   Replace an existing variant");
    console.log("                      (e.g. --replace default, --replace ghost)\n");

    // Show current adoptions
    const info = await get(`/adopt?componentId=${componentId}`);
    const adoptions = info.adoptions || [];
    if (adoptions.length > 0) {
      console.log("Current adoptions:");
      for (const a of adoptions) {
        const mode = a.mode === "new-variant" ? "NEW" : `REPLACE:${a.targetVariant}`;
        console.log(`  ${mode.padEnd(20)} ${a.iterationFile}`);
      }
    }
    return;
  }

  const mode = isNewVariant ? "new-variant" : "replacement";

  const result = await post("/adopt", {
    iterationFile,
    componentId,
    mode,
    targetVariant: replaceLabel || undefined,
  });

  if (mode === "new-variant") {
    console.log(`Adopted "${iterationFile}" as new variant for ${componentId}`);
  } else {
    console.log(
      `Adopted "${iterationFile}" as replacement for "${replaceLabel}" on ${componentId}`,
    );
  }
  console.log(`  Manifest entry: ${result.adoption?.id ?? "ok"}`);
}

export async function unadopt(args) {
  const id = args[0];
  if (!id) {
    throw new Error("Usage: rdna-playground unadopt <adoption-id>");
  }

  const result = await post("/adopt", {
    action: "remove",
    id,
  });

  console.log(`Removed adoption: ${result.removed ?? id}`);
}

export async function listAdoptions() {
  const result = await get("/adopt");
  const adoptions = result.adoptions || [];

  if (adoptions.length === 0) {
    console.log("No active adoptions.");
    return;
  }

  console.log(`${adoptions.length} adoption(s):`);
  for (const a of adoptions) {
    const mode = a.mode === "new-variant" ? "NEW" : `REPLACE:${a.targetVariant}`;
    console.log(
      `  ${(a.id || "?").slice(0, 8)} ${a.componentId.padEnd(20)} ${mode.padEnd(20)} ${a.iterationFile}`,
    );
  }
}

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}
