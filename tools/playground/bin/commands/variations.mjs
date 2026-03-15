import { readFileSync } from "fs";
import { resolve } from "path";
import { get, post, del } from "../lib/api.mjs";

const SUBCOMMANDS = {
  list,
  generate,
  write,
  adopt,
  trash,
};

export async function run(args) {
  const [subcommand, ...rest] = args;
  const handler = subcommand ? SUBCOMMANDS[subcommand] : undefined;

  if (!handler) {
    console.log(`
Usage: rdna-playground variations <subcommand>

Subcommands:
  list [component]
  generate <component> [count]
  write <component> <file>
  trash <component> <iteration-file>
  adopt <component> <iteration-file>
`);
    return;
  }

  await handler(rest);
}

async function list(args) {
  const componentId = args[0];
  const data = await get("/generate");

  if (componentId) {
    const files = data.byComponent?.[componentId] || [];
    console.log(`${componentId}: ${files.length} iteration(s)`);
    for (const file of files) console.log(`  ${file}`);
    return;
  }

  console.log(`Total iterations: ${data.files.length}`);
  for (const [component, files] of Object.entries(data.byComponent || {})) {
    console.log(`${component}: ${files.length}`);
  }
}

async function generate(args) {
  const componentId = args[0];
  const variationCount = Number.parseInt(args[1] ?? "2", 10);
  if (!componentId) {
    throw new Error("Usage: rdna-playground variations generate <component> [count]");
  }

  const result = await post("/generate", { componentId, variationCount });
  console.log(`Generated ${result.writtenFiles.length} iteration(s)`);
  for (const file of result.writtenFiles) console.log(`  ${file}`);
}

async function write(args) {
  const [componentId, sourcePath] = args;
  if (!componentId || !sourcePath) {
    throw new Error("Usage: rdna-playground variations write <component> <file>");
  }

  const contents = readFileSync(resolve(sourcePath), "utf-8");
  const result = await post("/generate/write", { componentId, contents });

  console.log(`Written: ${result.fileName}`);
  console.log(`Total iterations: ${result.totalIterations}`);
}

async function trash(args) {
  const [componentId, iterationFile] = args;
  if (!componentId || !iterationFile) {
    throw new Error("Usage: rdna-playground variations trash <component> <iteration-file>");
  }

  await del(`/generate/${encodeURIComponent(iterationFile)}`);
  console.log(`Deleted: ${iterationFile}`);
}

async function adopt(args) {
  const [componentId, iterationFile] = args;
  if (!componentId || !iterationFile) {
    throw new Error("Usage: rdna-playground variations adopt <component> <iteration-file>");
  }

  const result = await post("/adopt", { componentId, iterationFile });
  console.log(`Adopted: ${result.iterationFile}`);
  console.log(`Target: ${result.targetPath}`);
}
