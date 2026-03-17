"use client";

import { useCallback, useEffect, useState } from "react";

export interface ClientAnnotation {
  id: string;
  componentId: string;
  intent: string;
  priority: string | null;
  status: string;
  message: string;
  resolution?: string;
  variant?: string;
  colorMode?: "light" | "dark";
  forcedState?: string;
  x?: number;
  y?: number;
  createdAt: number;
  resolvedAt?: number;
  // Adopt-specific fields (present when intent === "adopt")
  iterationFile?: string;
  adoptionMode?: "replacement" | "new-variant";
  targetVariant?: string;
}

export function usePlaygroundAnnotations(): {
  annotations: ClientAnnotation[];
  refresh: () => void;
  countForComponent: (componentId: string) => number;
  annotationsForComponent: (componentId: string) => ClientAnnotation[];
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

  const annotationsForComponent = useCallback(
    (componentId: string) =>
      annotations.filter((a) => a.componentId === componentId),
    [annotations],
  );

  return { annotations, refresh, countForComponent, annotationsForComponent };
}
