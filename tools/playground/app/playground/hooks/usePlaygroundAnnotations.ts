"use client";

import { useCallback, useEffect, useState } from "react";

export interface ClientAnnotation {
  id: string;
  componentId: string;
  intent: string;
  severity: string;
  status: string;
  message: string;
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}

export function usePlaygroundAnnotations(): {
  annotations: ClientAnnotation[];
  refresh: () => void;
  countForComponent: (componentId: string) => number;
} {
  const [annotations, setAnnotations] = useState<ClientAnnotation[]>([]);

  const refresh = useCallback(() => {
    fetch("/playground/api/agent/annotation")
      .then((res) => (res.ok ? res.json() : { annotations: [] }))
      .then((data) => setAnnotations(data.annotations ?? []))
      .catch(() => setAnnotations([]));
  }, []);

  // Fetch once on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const countForComponent = useCallback(
    (componentId: string) =>
      annotations.filter(
        (a) =>
          a.componentId === componentId &&
          (a.status === "pending" || a.status === "acknowledged"),
      ).length,
    [annotations],
  );

  return { annotations, refresh, countForComponent };
}
