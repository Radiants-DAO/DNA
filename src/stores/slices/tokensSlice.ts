import type { StateCreator } from "zustand";
import type { AppState, TokensSlice } from "../types";
import { commands } from "../../bindings";

export const createTokensSlice: StateCreator<
  AppState,
  [],
  [],
  TokensSlice
> = (set) => ({
  tokens: null,
  tokensLoading: false,
  tokensError: null,

  loadTokens: async (cssPath) => {
    set({ tokensLoading: true, tokensError: null });

    const result = await commands.parseTokens(cssPath);

    if (result.status === "ok") {
      set({ tokens: result.data, tokensLoading: false });
    } else {
      set({ tokensError: result.error, tokensLoading: false });
    }
  },

  clearTokens: () => set({ tokens: null, tokensError: null }),
});
