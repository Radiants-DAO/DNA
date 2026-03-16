"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { PlaygroundSignalEvent } from "../api/agent/signal-store";
import { parsePlaygroundSignalEvent } from "../lib/playground-signal-event";

type DataChangeEvent = Exclude<PlaygroundSignalEvent, { type: "work-signals" }>;

export function usePlaygroundSignals(
  onSignalEvent?: (event: DataChangeEvent) => void,
): Set<string> {
  const [active, setActive] = useState<Set<string>>(new Set());
  const notifySignalEvent = useEffectEvent((event: DataChangeEvent) => {
    onSignalEvent?.(event);
  });

  useEffect(() => {
    const eventSource = new EventSource("/playground/api/agent/signal");

    eventSource.onmessage = (event) => {
      const parsed = parsePlaygroundSignalEvent(event.data);
      if (!parsed) return;

      if (parsed.type === "work-signals") {
        setActive(new Set(parsed.active));
        return;
      }

      notifySignalEvent(parsed);
    };

    return () => eventSource.close();
  }, []);

  return active;
}
