"use client";

import { createContext, useContext } from "react";
import type { Adoption } from "./hooks/useAdoptedVariants";

export interface AdoptionContextValue {
  adoptions: Adoption[];
  refresh: () => void;
  adoptionsForComponent: (componentId: string) => Adoption[];
  getReplacementFor: (componentId: string, variantLabel: string) => Adoption | undefined;
}

const defaultValue: AdoptionContextValue = {
  adoptions: [],
  refresh: () => {},
  adoptionsForComponent: () => [],
  getReplacementFor: () => undefined,
};

export const AdoptionContext = createContext<AdoptionContextValue>(defaultValue);

export function useAdoptionContext(): AdoptionContextValue {
  return useContext(AdoptionContext);
}
