"use client";

import { createContext, useContext } from "react";
import type { ForcedState } from "./types";

const ForcedStateContext = createContext<ForcedState>("default");

export const ForcedStateProvider = ForcedStateContext.Provider;

export function useForcedState() {
  return useContext(ForcedStateContext);
}
