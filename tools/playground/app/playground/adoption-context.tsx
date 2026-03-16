"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAdoptedVariants, type Adoption } from "./hooks/useAdoptedVariants";

interface AdoptionContextValue {
  adoptions: Adoption[];
  refresh: () => void;
  adoptionsForComponent: (componentId: string) => Adoption[];
  getReplacementFor: (componentId: string, variantLabel: string) => Adoption | undefined;
}

const AdoptionContext = createContext<AdoptionContextValue>({
  adoptions: [],
  refresh: () => {},
  adoptionsForComponent: () => [],
  getReplacementFor: () => undefined,
});

export function AdoptionProvider({ children }: { children: ReactNode }) {
  const value = useAdoptedVariants();
  return (
    <AdoptionContext.Provider value={value}>{children}</AdoptionContext.Provider>
  );
}

export function useAdoptionContext() {
  return useContext(AdoptionContext);
}
