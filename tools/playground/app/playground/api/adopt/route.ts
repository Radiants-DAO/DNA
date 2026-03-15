import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, relative } from "path";
import { execSync } from "child_process";
import { registry } from "../../registry";
import { validateAdoptionFile } from "../../lib/iteration-naming";
import { validateAdoptionTarget } from "../../lib/source-path-policy";

const MONO_ROOT = resolve(process.cwd(), "../..");
const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

const REGISTRY_SOURCE_PATHS = new Set(registry.map((e) => e.sourcePath));

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.iterationFile || !body?.componentId) {
    return NextResponse.json(
      { error: "Missing iterationFile or componentId" },
      { status: 400 },
    );
  }

  const entry = registry.find((e) => e.id === body.componentId);
  if (!entry) {
    return NextResponse.json(
      { error: `Unknown component: ${body.componentId}` },
      { status: 404 },
    );
  }

  const policyError = validateAdoptionTarget(entry.sourcePath, REGISTRY_SOURCE_PATHS);
  if (policyError) {
    return NextResponse.json(
      { error: policyError },
      { status: 403 },
    );
  }

  // --- Validate iteration filename: pattern, path traversal, cross-component ---
  const validation = validateAdoptionFile(body.iterationFile, body.componentId);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const iterationFileName = body.iterationFile as string;

  // Resolve and verify the file is actually inside ITERATIONS_DIR
  const iterationPath = resolve(ITERATIONS_DIR, iterationFileName);
  const relToIterations = relative(ITERATIONS_DIR, iterationPath);
  if (relToIterations.startsWith("..") || relToIterations.includes("/")) {
    return NextResponse.json(
      { error: "iterationFile resolved outside iterations directory" },
      { status: 400 },
    );
  }

  if (!existsSync(iterationPath)) {
    return NextResponse.json(
      { error: `Iteration file not found: ${iterationFileName}` },
      { status: 404 },
    );
  }

  const targetPath = resolve(MONO_ROOT, entry.sourcePath);
  if (!existsSync(targetPath)) {
    return NextResponse.json(
      { error: `Target source not found: ${entry.sourcePath}` },
      { status: 404 },
    );
  }

  // Read iteration content
  const iterationContent = readFileSync(iterationPath, "utf-8");

  // Replace target file
  const originalContent = readFileSync(targetPath, "utf-8");
  writeFileSync(targetPath, iterationContent);

  const errors: string[] = [];

  // Step 1: RDNA ESLint check
  try {
    execSync(
      `pnpm exec eslint --config eslint.rdna.config.mjs '${targetPath}'`,
      { cwd: MONO_ROOT, stdio: "pipe" },
    );
  } catch (error) {
    const stderr =
      error instanceof Error && "stderr" in error
        ? (error as { stderr: Buffer }).stderr?.toString()
        : "";
    errors.push(`ESLint RDNA violations:\n${stderr?.slice(0, 1500)}`);
  }

  // Step 2: TypeScript type-check on the touched file's package
  // Find the nearest tsconfig relative to the target
  const targetDir = resolve(targetPath, "..");
  const packageRoot = findPackageRoot(targetDir);

  if (packageRoot) {
    try {
      execSync(
        `pnpm exec tsc --noEmit --project '${resolve(packageRoot, "tsconfig.json")}'`,
        { cwd: MONO_ROOT, stdio: "pipe", timeout: 30_000 },
      );
    } catch (error) {
      const stdout =
        error instanceof Error && "stdout" in error
          ? (error as { stdout: Buffer }).stdout?.toString()
          : "";
      errors.push(`TypeScript errors:\n${stdout?.slice(0, 1500)}`);
    }
  }

  // If any check failed, rollback
  if (errors.length > 0) {
    writeFileSync(targetPath, originalContent);
    return NextResponse.json(
      {
        error: "Adopted file failed verification — rolled back",
        details: errors,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    success: true,
    componentId: body.componentId,
    targetPath: entry.sourcePath,
    iterationFile: iterationFileName,
  });
}

/**
 * Walk up from a directory to find the nearest package.json (package root).
 * Stops at MONO_ROOT to avoid escaping the repo.
 */
function findPackageRoot(dir: string): string | null {
  let current = dir;
  while (current.length >= MONO_ROOT.length) {
    if (existsSync(resolve(current, "package.json"))) {
      return current;
    }
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return null;
}
