"use client";

import { createContext, useContext } from "react";

export type AnnotationCountFn = (componentId: string) => number;

export const AnnotationCountContext = createContext<AnnotationCountFn>(() => 0);

export function useAnnotationCount(): AnnotationCountFn {
  return useContext(AnnotationCountContext);
}
