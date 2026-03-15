import { NextResponse } from "next/server";
import { resolve } from "path";
import { serverRegistry } from "../../../registry.server";
import { signalStore } from "../../agent/signal-store";
import { listAllIterations, writeVerifiedIteration } from "../../../lib/iterations.server";

const MONO_ROOT = resolve(process.cwd(), "../..");
const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.componentId || !body?.contents) {
    return NextResponse.json(
      { error: "Missing componentId or contents" },
      { status: 400 },
    );
  }

  const entry = serverRegistry.find((item) => item.id === body.componentId);
  if (!entry) {
    return NextResponse.json(
      { error: `Unknown component: ${body.componentId}` },
      { status: 404 },
    );
  }

  try {
    const result = writeVerifiedIteration({
      monoRoot: MONO_ROOT,
      iterationsDir: ITERATIONS_DIR,
      componentId: entry.id,
      contents: body.contents,
    });

    signalStore.iterationsChanged(entry.id);

    return NextResponse.json({
      success: true,
      fileName: result.fileName,
      totalIterations: listAllIterations(ITERATIONS_DIR).filter((file) =>
        file.startsWith(`${entry.id}.iteration-`),
      ).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Write failed" },
      { status: 422 },
    );
  }
}
