import { NextResponse } from "next/server";
import { captureStore } from "../capture-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  const req = captureStore.get(id);
  if (!req) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: req.id,
    status: req.status,
    dataUrl: req.dataUrl ?? null,
    error: req.error ?? null,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  if (body.action === "create") {
    if (typeof body.previewUrl !== "string") {
      return NextResponse.json({ error: "Missing previewUrl" }, { status: 400 });
    }
    const req = captureStore.create(body.previewUrl);
    return NextResponse.json({ requestId: req.id });
  }

  if (body.action === "complete") {
    if (typeof body.requestId !== "string" || typeof body.dataUrl !== "string") {
      return NextResponse.json(
        { error: "Missing requestId or dataUrl" },
        { status: 400 },
      );
    }
    const found = captureStore.complete(body.requestId, body.dataUrl);
    if (!found) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "error") {
    if (typeof body.requestId !== "string") {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }
    captureStore.fail(body.requestId, body.error ?? "Unknown error");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
