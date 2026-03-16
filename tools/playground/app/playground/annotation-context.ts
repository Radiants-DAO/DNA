"use client";

import { createContext, useContext } from "react";
import type { ClientAnnotation } from "./hooks/usePlaygroundAnnotations";

export interface AnnotationContextValue {
  countForComponent: (componentId: string) => number;
  annotationsForComponent: (componentId: string) => ClientAnnotation[];
}

const defaultValue: AnnotationContextValue = {
  countForComponent: () => 0,
  annotationsForComponent: () => [],
};

export const AnnotationContext = createContext<AnnotationContextValue>(defaultValue);

export function useAnnotationContext(): AnnotationContextValue {
  return useContext(AnnotationContext);
}
