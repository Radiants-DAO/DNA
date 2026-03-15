import { NextResponse } from "next/server";
import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { signalStore } from "../../agent/signal-store";
import { parseIterationName } from "../../../lib/iteration-naming";
import { resolveIterationTarget } from "../../../lib/iterations.server";

const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const parsed = parseIterationName(file);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid iteration filename" }, { status: 400 });
  }

  let target: string;
  try {
    target = resolveIterationTarget(ITERATIONS_DIR, file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid filename" },
      { status: 400 },
    );
  }

  if (!existsSync(target)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  unlinkSync(target);
  signalStore.iterationsChanged(parsed.componentId);

  return NextResponse.json({ deleted: file });
}
