import type { PlaygroundSignalEvent } from "../api/agent/signal-store";

export function parsePlaygroundSignalEvent(raw: string): PlaygroundSignalEvent | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;

    if (
      data.type === "work-signals" &&
      Array.isArray(data.active) &&
      data.active.every((item) => typeof item === "string")
    ) {
      return { type: "work-signals", active: data.active };
    }

    if (data.type === "iterations-changed") {
      return {
        type: "iterations-changed",
        componentId: typeof data.componentId === "string" ? data.componentId : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}
