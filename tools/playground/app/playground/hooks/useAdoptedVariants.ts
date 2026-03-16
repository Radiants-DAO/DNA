"use client";

import { useCallback, useEffect, useState } from "react";

export interface Adoption {
  id: string;
  componentId: string;
  iterationFile: string;
  mode: "new-variant" | "replacement";
  targetVariant?: string;
  label?: string;
  adoptedAt: number;
}

export function useAdoptedVariants(): {
  adoptions: Adoption[];
  refresh: () => void;
  adoptionsForComponent: (componentId: string) => Adoption[];
  getReplacementFor: (componentId: string, variantLabel: string) => Adoption | undefined;
} {
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);

  const refresh = useCallback(() => {
    fetch("/playground/api/adopt")
      .then((res) => (res.ok ? res.json() : { adoptions: [] }))
      .then((data) => setAdoptions(data.adoptions ?? []))
      .catch(() => setAdoptions([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const adoptionsForComponent = useCallback(
    (componentId: string) =>
      adoptions.filter((a) => a.componentId === componentId),
    [adoptions],
  );

  const getReplacementFor = useCallback(
    (componentId: string, variantLabel: string) =>
      adoptions.find(
        (a) =>
          a.componentId === componentId &&
          a.mode === "replacement" &&
          a.targetVariant === variantLabel,
      ),
    [adoptions],
  );

  return { adoptions, refresh, adoptionsForComponent, getReplacementFor };
}
