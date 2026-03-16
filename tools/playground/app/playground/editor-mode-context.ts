"use client";

import { createContext, useContext } from "react";
import type { EditorMode } from "./ModeToolbar";

export interface EditorModeContextValue {
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;
}

const defaultValue: EditorModeContextValue = {
  editorMode: "component-id",
  setEditorMode: () => {},
};

export const EditorModeContext = createContext<EditorModeContextValue>(defaultValue);

export function useEditorMode(): EditorModeContextValue {
  return useContext(EditorModeContext);
}
