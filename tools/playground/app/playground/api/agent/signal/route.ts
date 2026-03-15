import { NextResponse } from "next/server";
import { signalStore } from "../signal-store";

export const dynamic = "force-dynamic";

function encodeEvent(encoder: TextEncoder, payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ active: signalStore.getActive() });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encodeEvent(encoder, payload));
      };

      send({ type: "work-signals", active: signalStore.getActive() });

      const unsubscribe = signalStore.subscribe((event) => send(event));
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);

      const cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const action = body.action as string;
  const componentId = typeof body.componentId === "string" ? body.componentId : undefined;

  if (action !== "clear-all" && !componentId) {
    return NextResponse.json({ error: "Missing componentId" }, { status: 400 });
  }

  if (action === "work-start" && componentId) {
    signalStore.workStart(componentId);
  } else if (action === "work-end" && componentId) {
    signalStore.workEnd(componentId);
  } else if (action === "clear-all") {
    signalStore.clearAll();
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    active: signalStore.getActive(),
  });
}
