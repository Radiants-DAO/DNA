"use client";

import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { registryById } from "../../registry";

/** Params that control rendering context, not component props */
const RESERVED_PARAMS = new Set([
  "colorMode",
  "state",
  "capture",
  "bg",
  "padding",
]);

function coerceValue(value: string, propDef?: { type: string }): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (propDef?.type === "number") return Number(value);
  return value;
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ component: string }>;
}) {
  const { component } = use(params);
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const entry = registryById.get(component);
  const Component = entry?.Component ?? entry?.rawComponent;

  // Parse props from URL search params
  const props: Record<string, unknown> = {};
  if (entry) {
    for (const [key, value] of searchParams.entries()) {
      if (RESERVED_PARAMS.has(key)) continue;
      props[key] = coerceValue(value, entry.props?.[key]);
    }
  }

  const colorMode = searchParams.get("colorMode") ?? "light";
  const forcedState = searchParams.get("state");
  const captureId = searchParams.get("capture");

  // Apply color mode to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorMode);
    document.documentElement.classList.toggle("dark", colorMode === "dark");
  }, [colorMode]);

  // Mark ready after first paint
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  // Auto-capture when capture=<requestId> and component is ready
  useEffect(() => {
    if (!captureId || !ready || !containerRef.current) return;

    const node = containerRef.current;

    (async () => {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(node, { pixelRatio: 2 });
        await fetch("/playground/api/agent/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            requestId: captureId,
            dataUrl,
          }),
        });
      } catch (err) {
        console.error("[preview] capture failed:", err);
        await fetch("/playground/api/agent/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "error",
            requestId: captureId,
            error: err instanceof Error ? err.message : String(err),
          }),
        }).catch(() => {});
      }
    })();
  }, [captureId, ready]);

  if (!entry || !Component) {
    return (
      <div data-qa-error="not-found">
        Component &quot;{component}&quot; not found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-qa-ready={ready || undefined}
      data-qa-component={component}
      data-force-state={forcedState ?? undefined}
      className="inline-flex p-4"
    >
      <Component {...props} />
    </div>
  );
}
