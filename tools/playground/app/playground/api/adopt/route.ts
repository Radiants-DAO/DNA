import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { serverRegistry } from "../../registry.server";
import { validateAdoptionFile } from "../../lib/iteration-naming";

export const dynamic = "force-dynamic";

const MANIFEST_PATH = resolve(process.cwd(), "generated/adopted-variants.json");
const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

interface AdoptionEntry {
  id: string;
  componentId: string;
  iterationFile: string;
  mode: "new-variant" | "replacement";
  targetVariant?: string;
  label?: string;
  adoptedAt: number;
}

interface Manifest {
  adoptions: AdoptionEntry[];
}

function readManifest(): Manifest {
  try {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return { adoptions: [] };
  }
}

function writeManifest(manifest: Manifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function generateId(): string {
  return `adopt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const componentId = url.searchParams.get("componentId") ?? undefined;

  const manifest = readManifest();

  // If componentId is specified, also return available variants for the picker
  if (componentId) {
    const entry = serverRegistry.find((e) => e.id === componentId);
    const variants = entry?.variants?.map((v) => ({ label: v.label })) ?? [];
    // Always include "default" as a replaceable target
    if (!variants.some((v) => v.label === "default")) {
      variants.unshift({ label: "default" });
    }

    return NextResponse.json({
      adoptions: manifest.adoptions.filter((a) => a.componentId === componentId),
      variants,
    });
  }

  return NextResponse.json({ adoptions: manifest.adoptions });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Remove an adoption
  if (body?.action === "remove") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const manifest = readManifest();
    const idx = manifest.adoptions.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Adoption not found" }, { status: 404 });
    }

    const [removed] = manifest.adoptions.splice(idx, 1);
    writeManifest(manifest);
    return NextResponse.json({ success: true, removed: removed.id });
  }

  // Clear all adoptions for a component
  if (body?.action === "clear") {
    const manifest = readManifest();
    const componentId = body.componentId;
    if (componentId) {
      manifest.adoptions = manifest.adoptions.filter((a) => a.componentId !== componentId);
    } else {
      manifest.adoptions = [];
    }
    writeManifest(manifest);
    return NextResponse.json({ success: true });
  }

  // Adopt an iteration
  const { iterationFile, componentId, mode, targetVariant } = body ?? {};

  if (!iterationFile || !componentId) {
    return NextResponse.json(
      { error: "Missing iterationFile or componentId" },
      { status: 400 },
    );
  }

  if (mode !== "new-variant" && mode !== "replacement") {
    return NextResponse.json(
      { error: 'mode must be "new-variant" or "replacement"' },
      { status: 400 },
    );
  }

  // Validate iteration file format and component match
  const validation = validateAdoptionFile(iterationFile, componentId);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Verify the iteration file exists
  const iterationPath = resolve(ITERATIONS_DIR, iterationFile);
  if (!existsSync(iterationPath)) {
    return NextResponse.json(
      { error: `Iteration file not found: ${iterationFile}` },
      { status: 404 },
    );
  }

  // For replacement mode, validate the target variant exists
  if (mode === "replacement") {
    if (!targetVariant) {
      return NextResponse.json(
        { error: "replacement mode requires targetVariant" },
        { status: 400 },
      );
    }

    const entry = serverRegistry.find((e) => e.id === componentId);
    if (!entry) {
      return NextResponse.json(
        { error: `Unknown component: ${componentId}` },
        { status: 404 },
      );
    }

    // "default" is always valid; otherwise check variant labels
    if (targetVariant !== "default") {
      const hasVariant = entry.variants?.some((v) => v.label === targetVariant);
      if (!hasVariant) {
        return NextResponse.json(
          { error: `Variant "${targetVariant}" not found on ${componentId}` },
          { status: 404 },
        );
      }
    }
  }

  const manifest = readManifest();

  // For replacement: remove any existing adoption for the same target
  if (mode === "replacement") {
    manifest.adoptions = manifest.adoptions.filter(
      (a) =>
        !(a.componentId === componentId &&
          a.mode === "replacement" &&
          a.targetVariant === targetVariant),
    );
  }

  const adoption: AdoptionEntry = {
    id: generateId(),
    componentId,
    iterationFile,
    mode,
    targetVariant: mode === "replacement" ? targetVariant : undefined,
    label: iterationFile.replace(".tsx", ""),
    adoptedAt: Date.now(),
  };

  manifest.adoptions.push(adoption);
  writeManifest(manifest);

  return NextResponse.json({ success: true, adoption });
}
