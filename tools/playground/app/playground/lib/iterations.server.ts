// app/playground/lib/iterations.server.ts
import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { relative, resolve } from "path";
import { parseIterationName, sortIterationFiles } from "./iteration-naming";

export function listAllIterations(iterationsDir: string): string[] {
  if (!existsSync(iterationsDir)) return [];
  return sortIterationFiles(readdirSync(iterationsDir));
}

export function groupIterationsByComponent(files: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const file of files) {
    const parsed = parseIterationName(file);
    if (!parsed) continue;
    if (!grouped[parsed.componentId]) grouped[parsed.componentId] = [];
    grouped[parsed.componentId].push(file);
  }

  return grouped;
}

export function nextIterationFileName(iterationsDir: string, componentId: string): string {
  const files = listAllIterations(iterationsDir);
  let max = 0;

  for (const file of files) {
    const parsed = parseIterationName(file);
    if (parsed?.componentId === componentId && parsed.n > max) {
      max = parsed.n;
    }
  }

  return `${componentId}.iteration-${max + 1}.tsx`;
}

export function writeVerifiedIteration({
  monoRoot,
  iterationsDir,
  componentId,
  contents,
}: {
  monoRoot: string;
  iterationsDir: string;
  componentId: string;
  contents: string;
}): { fileName: string } {
  if (!existsSync(iterationsDir)) {
    mkdirSync(iterationsDir, { recursive: true });
  }

  const fileName = nextIterationFileName(iterationsDir, componentId);
  const target = resolve(iterationsDir, fileName);
  writeFileSync(target, contents, "utf-8");

  try {
    execSync(
      `pnpm exec eslint --config eslint.rdna.config.mjs '${target}'`,
      { cwd: monoRoot, stdio: "pipe" },
    );
  } catch (error) {
    unlinkSync(target);
    const stderr =
      error instanceof Error && "stderr" in error
        ? (error as { stderr?: Buffer }).stderr?.toString() ?? ""
        : "";
    throw new Error(stderr || "RDNA lint failed");
  }

  return { fileName };
}

export function resolveIterationTarget(iterationsDir: string, fileName: string): string {
  const target = resolve(iterationsDir, fileName);
  const rel = relative(iterationsDir, target);
  if (rel.startsWith("..") || rel.includes("/")) {
    throw new Error("Invalid iteration filename");
  }
  return target;
}
