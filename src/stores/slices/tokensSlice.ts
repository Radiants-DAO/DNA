import type { StateCreator } from "zustand";
import type { AppState, TokensSlice, ResolvedTokenMap } from "../types";
import type { StyleValue } from "../../types/styleValue";
import { commands } from "../../bindings";
import {
  resolveTokenChain,
  createTokenResolver,
  type TokenMap,
} from "../../utils/tokenResolver";

/**
 * Build a TokenMap from ThemeTokens (combining inline and public tokens)
 */
function buildTokenMap(tokens: {
  inline: Partial<{ [key: string]: string }>;
  public: Partial<{ [key: string]: string }>;
}): TokenMap {
  const map = new Map<string, string>();

  // Add inline tokens first
  for (const [key, value] of Object.entries(tokens.inline)) {
    if (value !== undefined) {
      map.set(key, value);
    }
  }

  // Add public tokens (may override inline)
  for (const [key, value] of Object.entries(tokens.public)) {
    if (value !== undefined) {
      map.set(key, value);
    }
  }

  return map;
}

export const createTokensSlice: StateCreator<
  AppState,
  [],
  [],
  TokensSlice
> = (set, get) => ({
  tokens: null,
  tokensLoading: false,
  tokensError: null,
  resolvedTokens: new Map(),

  loadTokens: async (cssPath) => {
    set({ tokensLoading: true, tokensError: null });

    const result = await commands.parseTokens(cssPath);

    if (result.status === "ok") {
      // Clear resolved cache when tokens change
      set({
        tokens: result.data,
        tokensLoading: false,
        resolvedTokens: new Map(),
      });
    } else {
      set({ tokensError: result.error, tokensLoading: false });
    }
  },

  clearTokens: () =>
    set({
      tokens: null,
      tokensError: null,
      resolvedTokens: new Map(),
    }),

  resolveToken: (name: string): StyleValue | null => {
    const state = get();

    // Check if tokens are loaded
    if (!state.tokens) {
      return null;
    }

    // Check cache first
    const cached = state.resolvedTokens.get(name);
    if (cached !== undefined) {
      return cached;
    }

    // Build token map and resolve
    const tokenMap = buildTokenMap(state.tokens);
    const resolved = resolveTokenChain(name, tokenMap);

    // Cache the result (including null for not found)
    if (resolved) {
      // Update cache - use functional update to avoid race conditions
      set((prevState) => {
        const newResolved = new Map(prevState.resolvedTokens);
        newResolved.set(name, resolved);
        return { resolvedTokens: newResolved };
      });
    }

    return resolved;
  },

  invalidateResolvedTokens: () => {
    set({ resolvedTokens: new Map() });
  },
});
