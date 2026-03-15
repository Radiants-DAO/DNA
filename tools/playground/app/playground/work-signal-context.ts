"use client";

import { createContext, useContext } from "react";

export const WorkSignalContext = createContext<Set<string>>(new Set());

export function useWorkSignalSet(): Set<string> {
  return useContext(WorkSignalContext);
}
