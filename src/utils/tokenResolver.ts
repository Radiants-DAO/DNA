/**
 * Token Resolution Chain
 *
 * Resolves CSS custom property (var()) reference chains with proper
 * circular reference detection using a visited set.
 *
 * Part of fn-2-gnc.3 - Token Resolution Chain implementation
 */

import type { StyleValue, VarValue, VarFallback } from "../types/styleValue";
import { parseStyleValue } from "./parseStyleValue";

/**
 * Token map type - maps token names (without --) to their raw CSS values
 */
export type TokenMap = Map<string, string>;

/**
 * Resolved token map - maps token names to resolved StyleValue
 */
export type ResolvedTokenMap = Map<string, StyleValue>;

/**
 * Resolution result with metadata
 */
export interface ResolutionResult {
  /** The resolved StyleValue, or null if resolution failed */
  value: StyleValue | null;
  /** Path of tokens visited during resolution (for debugging) */
  path: string[];
  /** Whether a circular reference was detected */
  isCircular: boolean;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Resolve a token chain to its final value.
 *
 * Follows var() references until reaching a concrete value or detecting
 * a circular reference. Uses a visited set for IMMEDIATE cycle detection
 * (not max depth).
 *
 * @param tokenName - Token name without -- prefix (e.g., "color-primary")
 * @param tokens - Map of token names to raw CSS values
 * @param visited - Set of already visited token names (for cycle detection)
 * @returns The resolved StyleValue, or null if unresolved/circular
 *
 * @example
 * const tokens = new Map([
 *   ['color-brand', '#3b82f6'],
 *   ['color-primary', 'var(--color-brand)'],
 *   ['color-surface', 'var(--color-primary)'],
 * ]);
 *
 * resolveTokenChain('color-surface', tokens);
 * // Returns: { type: 'color', colorSpace: 'srgb', components: [...], alpha: 1 }
 */
export function resolveTokenChain(
  tokenName: string,
  tokens: TokenMap,
  visited: Set<string> = new Set()
): StyleValue | null {
  // IMMEDIATE cycle detection - check BEFORE processing
  if (visited.has(tokenName)) {
    const cyclePath = [...visited, tokenName];
    console.warn(
      `Circular token reference detected: ${cyclePath.map((t) => `--${t}`).join(" -> ")}`
    );
    return null;
  }

  // Mark as visited
  visited.add(tokenName);

  // Get raw value from tokens
  const rawValue = tokens.get(tokenName);
  if (!rawValue) {
    // Token not found
    return null;
  }

  // Parse the raw CSS value
  const parsed = parseStyleValue(rawValue);
  if (!parsed) {
    return null;
  }

  // If it's not a var reference, we're done
  if (parsed.type !== "var") {
    return parsed;
  }

  // It's a var reference - resolve recursively
  const varValue = parsed as VarValue;
  const referencedName = varValue.value; // Name without --

  // Try to resolve the referenced token
  const resolved = resolveTokenChain(referencedName, tokens, visited);

  // If resolution succeeded, return the resolved value
  if (resolved) {
    return resolved;
  }

  // Resolution failed - try fallback if available
  if (varValue.fallback) {
    return varValue.fallback;
  }

  // No fallback and couldn't resolve
  return null;
}

/**
 * Resolve a token chain with full result metadata.
 *
 * Provides additional information about the resolution process,
 * including the path taken and whether a cycle was detected.
 *
 * @param tokenName - Token name without -- prefix
 * @param tokens - Map of token names to raw CSS values
 * @returns ResolutionResult with value and metadata
 */
export function resolveTokenChainWithMetadata(
  tokenName: string,
  tokens: TokenMap
): ResolutionResult {
  const visited = new Set<string>();
  const path: string[] = [];
  let isCircular = false;
  let error: string | undefined;

  function resolve(name: string): StyleValue | null {
    // Check for cycle
    if (visited.has(name)) {
      isCircular = true;
      path.push(name);
      error = `Circular reference: ${path.map((t) => `--${t}`).join(" -> ")}`;
      return null;
    }

    visited.add(name);
    path.push(name);

    const rawValue = tokens.get(name);
    if (!rawValue) {
      error = `Token --${name} not found`;
      return null;
    }

    const parsed = parseStyleValue(rawValue);
    if (!parsed) {
      error = `Failed to parse value "${rawValue}" for token --${name}`;
      return null;
    }

    if (parsed.type !== "var") {
      return parsed;
    }

    const varValue = parsed as VarValue;
    const resolved = resolve(varValue.value);

    if (resolved) {
      return resolved;
    }

    if (varValue.fallback) {
      return varValue.fallback;
    }

    return null;
  }

  const value = resolve(tokenName);

  return {
    value,
    path,
    isCircular,
    error,
  };
}

/**
 * Resolve a StyleValue that may contain var() references.
 *
 * If the value is a var reference, resolves it using the token map.
 * Otherwise, returns the value as-is.
 *
 * @param value - StyleValue to resolve
 * @param tokens - Map of token names to raw CSS values
 * @returns Resolved StyleValue or original if not a var
 */
export function resolveStyleValue(
  value: StyleValue,
  tokens: TokenMap
): StyleValue {
  if (value.type !== "var") {
    return value;
  }

  const varValue = value as VarValue;
  const resolved = resolveTokenChain(varValue.value, tokens);

  if (resolved) {
    return resolved;
  }

  // Try fallback
  if (varValue.fallback) {
    // Recursively resolve fallback in case it's also a var
    return resolveStyleValue(varValue.fallback as StyleValue, tokens);
  }

  // Return original var if can't resolve
  return value;
}

/**
 * Resolve all tokens in a map, returning a map of resolved values.
 *
 * Caches resolved values to avoid redundant resolution.
 *
 * @param tokens - Map of token names to raw CSS values
 * @returns Map of token names to resolved StyleValue
 */
export function resolveAllTokens(tokens: TokenMap): ResolvedTokenMap {
  const resolved = new Map<string, StyleValue>();

  for (const [name] of tokens) {
    const result = resolveTokenChain(name, tokens);
    if (result) {
      resolved.set(name, result);
    }
  }

  return resolved;
}

/**
 * Create a token resolver function bound to a specific token map.
 *
 * Useful for creating a resolver that can be used repeatedly
 * with the same token context.
 *
 * @param tokens - Map of token names to raw CSS values
 * @returns Resolver function
 */
export function createTokenResolver(
  tokens: TokenMap
): (tokenName: string) => StyleValue | null {
  // Cache for resolved values
  const cache = new Map<string, StyleValue | null>();

  return (tokenName: string): StyleValue | null => {
    if (cache.has(tokenName)) {
      return cache.get(tokenName) ?? null;
    }

    const resolved = resolveTokenChain(tokenName, tokens);
    cache.set(tokenName, resolved);
    return resolved;
  };
}

/**
 * Check if a CSS value string contains a var() reference.
 */
export function containsVarReference(value: string): boolean {
  return /var\s*\(/.test(value);
}

/**
 * Extract token name from a var() reference.
 * Returns null if the value is not a simple var() reference.
 *
 * @param value - CSS value string
 * @returns Token name without -- prefix, or null
 */
export function extractVarName(value: string): string | null {
  const match = value.match(/^var\s*\(\s*--([^,)]+)/);
  return match ? match[1].trim() : null;
}
