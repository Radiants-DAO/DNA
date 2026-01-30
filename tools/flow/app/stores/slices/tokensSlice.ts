import type { StateCreator } from "zustand";
import type { AppState, TokensSlice, ResolvedTokenMap } from "../types";
import type { StyleValue } from "../../types/styleValue";
import type { ThemeTokens } from "../../bindings";
import { commands } from "../../bindings";
import {
  resolveTokenChain,
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

/**
 * Build a TokenMap with dark mode overrides applied
 */
function buildTokenMapWithDarkMode(
  tokens: ThemeTokens,
  darkTokens: Partial<{ [key: string]: string }> | null
): TokenMap {
  const map = buildTokenMap(tokens);

  // Apply dark mode overrides
  if (darkTokens) {
    for (const [key, value] of Object.entries(darkTokens)) {
      if (value !== undefined) {
        map.set(key, value);
      }
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
  darkTokens: null,
  colorMode: "light",
  resolvedTokens: new Map(),

  loadTokens: async (cssPath) => {
    set({ tokensLoading: true, tokensError: null });

    try {
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tokens";
      set({ tokensError: message, tokensLoading: false });
    }
  },

  loadThemeTokens: async (themePath) => {
    set({ tokensLoading: true, tokensError: null });

    try {
      const result = await commands.parseThemeTokensBundle(themePath);

      if (result.status === "ok") {
        set({
          tokens: result.data.base,
          darkTokens: result.data.dark,
          tokensLoading: false,
          resolvedTokens: new Map(),
        });
      } else {
        set({ tokensError: result.error, tokensLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load theme tokens";
      set({ tokensError: message, tokensLoading: false });
    }
  },

  clearTokens: () =>
    set({
      tokens: null,
      darkTokens: null,
      tokensError: null,
      resolvedTokens: new Map(),
    }),

  setColorMode: (mode) => {
    set({
      colorMode: mode,
      resolvedTokens: new Map(), // Invalidate cache on mode change
    });
  },

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

    // Build token map based on current color mode
    const tokenMap =
      state.colorMode === "dark"
        ? buildTokenMapWithDarkMode(state.tokens, state.darkTokens)
        : buildTokenMap(state.tokens);
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

  getActiveTokens: () => {
    const state = get();
    if (!state.tokens) return null;

    if (state.colorMode === "dark" && state.darkTokens) {
      // Merge dark tokens into a new ThemeTokens object
      const mergedPublic = { ...state.tokens.public };
      for (const [key, value] of Object.entries(state.darkTokens)) {
        if (value !== undefined) {
          mergedPublic[key] = value;
        }
      }
      return {
        inline: state.tokens.inline,
        public: mergedPublic,
      };
    }

    return state.tokens;
  },
});
