"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { parsePlaygroundSignalEvent } from "../lib/playground-signal-event";

export function usePlaygroundSignals(onIterationsChanged?: () => void): Set<string> {
  const [active, setActive] = useState<Set<string>>(new Set());
  const notifyIterationsChanged = useEffectEvent(() => {
    onIterationsChanged?.();
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

      notifyIterationsChanged();
    };

    return () => eventSource.close();
  }, []);

  return active;
}
