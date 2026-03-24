"use client";

import { createContext, useContext } from "react";

export interface ColorModeContextValue {
  colorMode: "light" | "dark";
  toggleColorMode: () => void;
}

const defaultValue: ColorModeContextValue = {
  colorMode: "light",
  toggleColorMode: () => {},
};

export const ColorModeContext = createContext<ColorModeContextValue>(defaultValue);

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext);
}
