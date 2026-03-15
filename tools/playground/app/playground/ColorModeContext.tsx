"use client";

import { createContext, useContext } from "react";

type ColorMode = "light" | "dark";

const ColorModeContext = createContext<ColorMode>("light");

export const ColorModeProvider = ColorModeContext.Provider;

export function useColorMode() {
  return useContext(ColorModeContext);
}
