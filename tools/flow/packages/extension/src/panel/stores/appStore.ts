/**
 * App Store - unified Zustand store combining all slices
 *
 * Combines mutation tracking, editor mode, and token state into a single store.
 */

import { create, type StateCreator } from "zustand";
import { createMutationSlice, type MutationSlice } from "./slices/mutationSlice";

/** Editor modes available in the panel */
export type EditorMode = "inspector" | "designer" | "developer";

/** Design token value */
export interface TokenValue {
  name: string;
  value: string;
  category: "color" | "spacing" | "typography" | "other";
}

/** Editor mode slice */
export interface EditorModeSlice {
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;
}

/** Tokens slice */
export interface TokensSlice {
  tokens: TokenValue[];
  setTokens: (tokens: TokenValue[]) => void;
  addToken: (token: TokenValue) => void;
  removeToken: (name: string) => void;
}

/** Combined app store type */
export type AppStore = MutationSlice & EditorModeSlice & TokensSlice;

/** Editor mode slice creator */
const createEditorModeSlice: StateCreator<AppStore, [], [], EditorModeSlice> = (set) => ({
  editorMode: "inspector",
  setEditorMode: (mode) => set({ editorMode: mode }),
});

/** Tokens slice creator */
const createTokensSlice: StateCreator<AppStore, [], [], TokensSlice> = (set) => ({
  tokens: [],
  setTokens: (tokens) => set({ tokens }),
  addToken: (token) =>
    set((state) => ({
      tokens: [...state.tokens, token],
    })),
  removeToken: (name) =>
    set((state) => ({
      tokens: state.tokens.filter((t) => t.name !== name),
    })),
});

/** Unified app store */
export const useAppStore = create<AppStore>()((...a) => ({
  ...createMutationSlice(...a),
  ...createEditorModeSlice(...a),
  ...createTokensSlice(...a),
}));
