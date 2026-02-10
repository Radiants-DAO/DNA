/**
 * Tokens Slice - Ported from Flow 0
 *
 * Manages design token loading and resolution.
 * Token loading is stubbed for the extension context - tokens will be
 * loaded via content bridge messaging instead of Tauri commands.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  ThemeTokens,
  StyleValue,
  ResolvedTokenMap,
} from "../types";

export interface TokensSlice {
  tokens: ThemeTokens | null;
  tokensLoading: boolean;
  tokensError: string | null;
  darkTokens: Record<string, string> | null;
  colorMode: "light" | "dark";
  resolvedTokens: ResolvedTokenMap;

  clearTokens: () => void;
  setColorMode: (mode: "light" | "dark") => void;
  resolveToken: (name: string) => StyleValue | null;
  invalidateResolvedTokens: () => void;
  getActiveTokens: () => ThemeTokens | null;
}

/**
 * Build a TokenMap from ThemeTokens (combining inline and public tokens)
 */
function buildTokenMap(tokens: ThemeTokens): Map<string, string> {
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
 * Simple token resolution - resolves var() references
 */
function resolveTokenValue(
  name: string,
  tokenMap: Map<string, string>,
  visited: Set<string> = new Set()
): StyleValue | null {
  // Prevent cycles
  if (visited.has(name)) {
    return null;
  }
  visited.add(name);

  const value = tokenMap.get(name);
  if (!value) {
    return null;
  }

  // Check for var() reference
  const varMatch = value.match(/^var\(--([^,)]+)(?:,\s*(.+))?\)$/);
  if (varMatch) {
    const refName = varMatch[1];
    const fallback = varMatch[2];

    const resolved = resolveTokenValue(refName, tokenMap, visited);
    if (resolved) {
      return resolved;
    }

    // Use fallback if provided
    if (fallback) {
      return { type: "unparsed", value: fallback.trim() };
    }

    return null;
  }

  // Return as unparsed value
  return { type: "unparsed", value };
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
    let tokenMap = buildTokenMap(state.tokens);

    // Apply dark mode overrides if applicable
    if (state.colorMode === "dark" && state.darkTokens) {
      for (const [key, value] of Object.entries(state.darkTokens)) {
        if (value !== undefined) {
          tokenMap.set(key, value);
        }
      }
    }

    const resolved = resolveTokenValue(name, tokenMap);

    // Cache the result
    if (resolved) {
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
