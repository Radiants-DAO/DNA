import { NextResponse } from "next/server";
import { annotationStore } from "../annotation-store";
import type { AnnotationIntent, AnnotationPriority, AnnotationStatus } from "../annotation-store";

export const dynamic = "force-dynamic";

const VALID_INTENTS: AnnotationIntent[] = ["fix", "change", "question"];
const VALID_PRIORITIES: NonNullable<AnnotationPriority>[] = ["P1", "P2", "P3", "P4"];
const VALID_STATUSES: AnnotationStatus[] = ["pending", "acknowledged", "resolved", "dismissed"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const componentId = url.searchParams.get("componentId") ?? undefined;
  const status = url.searchParams.get("status");

  if (status && VALID_STATUSES.includes(status as AnnotationStatus)) {
    return NextResponse.json({
      annotations: annotationStore.getByStatus(status as AnnotationStatus, componentId),
    });
  }

  if (componentId) {
    return NextResponse.json({
      annotations: annotationStore.getForComponent(componentId),
    });
  }

  return NextResponse.json({
    annotations: annotationStore.getAll(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const action = body.action as string;

  if (action === "annotate") {
    const { componentId, message, intent, priority, x, y } = body;

    if (!componentId || !message) {
      return NextResponse.json(
        { error: "Missing componentId or message" },
        { status: 400 },
      );
    }

    const normalizedId = String(componentId).toLowerCase();

    const resolvedIntent: AnnotationIntent =
      VALID_INTENTS.includes(intent) ? intent : "change";
    const resolvedPriority: AnnotationPriority =
      VALID_PRIORITIES.includes(priority) ? priority : null;

    const annotation = annotationStore.add({
      componentId: normalizedId,
      intent: resolvedIntent,
      priority: resolvedPriority,
      message,
      x: typeof x === "number" ? x : undefined,
      y: typeof y === "number" ? y : undefined,
    });

    return NextResponse.json({ success: true, annotation });
  }

  if (action === "resolve") {
    const { id, summary } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    try {
      const annotation = annotationStore.resolve(id, summary);
      return NextResponse.json({ success: true, annotation });
    } catch {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
  }

  if (action === "dismiss") {
    const { id, reason } = body;
    if (!id || !reason) {
      return NextResponse.json(
        { error: "Missing id or reason" },
        { status: 400 },
      );
    }

    try {
      const annotation = annotationStore.dismiss(id, reason);
      return NextResponse.json({ success: true, annotation });
    } catch {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
  }

  if (action === "clear-all") {
    annotationStore.clearAll();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
